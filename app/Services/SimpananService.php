<?php

namespace App\Services;

use App\Exceptions\PerluKonfirmasiAlihSisaWajibException;
use App\Models\Anggota;
use App\Models\JenisSimpanan;
use App\Models\RekeningKoperasi;
use App\Models\RekeningSimpanan;
use App\Models\Simpanan;
use App\Models\TransaksiKasKoperasi;
use App\Models\TransaksiSimpananBatch;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SimpananService
{
    /**
     * @return array{simpanan: Collection<int, Simpanan>, rekening_koperasi: Collection<int, RekeningKoperasi>}
     */
    public function getIndexData(): array
    {
        return [
            'simpanan' => Simpanan::with([
                'rekeningSimpanan.anggota',
                'rekeningSimpanan.jenisSimpanan',
                'batch.anggota',
                'batch.user',
            ])
                ->latest('created_at')
                ->get(),
            'rekening_koperasi' => RekeningKoperasi::query()
                ->orderBy('nama')
                ->get(['id', 'nama', 'jenis', 'nomor_rekening', 'saldo']),
        ];
    }

    /**
     * Get active anggota for form dropdown (lazy load on-demand)
     * @return Collection<int, Anggota>
     */
    public function getAnggotaForForm(): Collection
    {
        return Anggota::query()
            ->where('status', 'aktif')
            ->orderBy('nama')
            ->get(['id', 'no_anggota', 'nama', 'alamat']);
    }

    /**
     * Get rekening simpanan for form dropdowns (lazy load on-demand)
     * @return Collection<int, RekeningSimpanan>
     */
    public function getRekeningSimpananForForm(): Collection
    {
        return RekeningSimpanan::query()
            ->with(['anggota', 'jenisSimpanan'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function create(array $data): Simpanan
    {
        return DB::transaction(function () use ($data): Simpanan {
            $timestamp = Carbon::parse((string) ($data['created_at'] ?? now()));
            $userId = isset($data['user_id']) ? (string) $data['user_id'] : '';

            if ($userId === '') {
                throw new RuntimeException('User login tidak ditemukan untuk membuat batch transaksi simpanan.');
            }

            $rekeningKoperasi = RekeningKoperasi::query()
                ->lockForUpdate()
                ->findOrFail($data['rekening_koperasi_id']);

            $jenisByKode = $this->getJenisSimpananByKode();
            $anggotaId = (string) $data['anggota_id'];
            $batch = $this->createBatchTransaksiSimpanan(
                anggotaId: $anggotaId,
                userId: $userId,
                tanggalTransaksi: $timestamp,
                total: 0,
            );

            $pokokAmount = $this->toNullableAmount($data['simpanan_pokok_jumlah'] ?? null);
            $wajibInput = $this->toNullableAmount($data['simpanan_wajib_jumlah'] ?? null) ?? 0.0;
            $sukarelaInput = $this->toNullableAmount($data['simpanan_sukarela_jumlah'] ?? null) ?? 0.0;
            $alihkanWajibKeSukarela = (bool) ($data['alihkan_sisa_wajib_ke_sukarela'] ?? false);

            $createdTransactions = [];

            $pokokJenis = $jenisByKode['POKOK'];
            $pokokRekening = $this->firstOrCreateRekeningSimpanan($anggotaId, $pokokJenis->id);
            $pokokSudahTerisi = (float) $pokokRekening->saldo > 0;

            if ($pokokSudahTerisi) {
                if (($pokokAmount ?? 0) > 0) {
                    throw new RuntimeException('Simpanan pokok hanya dibayarkan sekali. Anggota ini sudah memiliki simpanan pokok.');
                }
            } else {
                if ($pokokAmount === null || $pokokAmount <= 0) {
                    throw new RuntimeException('Simpanan pokok wajib diisi untuk pembayaran pertama anggota.');
                }

                $this->validateInputAmount('pokok', $pokokAmount, $pokokJenis, true);
                $this->assertSaldoWithinMaximum('pokok', $pokokRekening, $pokokJenis, $pokokAmount);
                $createdTransactions[] = $this->createSimpananAndKas(
                    rekeningKoperasi: $rekeningKoperasi,
                    rekeningSimpanan: $pokokRekening,
                    batchId: $batch->id,
                    jumlah: $pokokAmount,
                    userId: $userId,
                    keterangan: $data['simpanan_pokok_keterangan'] ?? null,
                    createdAt: $timestamp,
                );
            }

            $overflowToSukarela = 0.0;

            $wajibJenis = $jenisByKode['WAJIB'];
            $wajibRekening = $this->firstOrCreateRekeningSimpanan($anggotaId, $wajibJenis->id);
            $wajibMax = $wajibJenis->jumlah_maksimum !== null
                ? (float) $wajibJenis->jumlah_maksimum
                : null;
            $wajibSudahPenuh = $wajibMax !== null && (float) $wajibRekening->saldo >= $wajibMax;

            if ($wajibSudahPenuh) {
                if ($wajibInput > 0) {
                    throw new RuntimeException('Simpanan wajib sudah mencapai batas maksimal. Tidak dapat menerima setoran wajib lagi.');
                }
            } else {

                $this->validateInputAmount('wajib', $wajibInput, $wajibJenis, false);

                [$wajibAccepted, $overflowToSukarela] = $this->splitWajibAmount(
                    rekening: $wajibRekening,
                    jenis: $wajibJenis,
                    inputAmount: $wajibInput,
                    allowOverflowTransfer: $alihkanWajibKeSukarela,
                );

                if ($wajibAccepted > 0) {
                    $createdTransactions[] = $this->createSimpananAndKas(
                        rekeningKoperasi: $rekeningKoperasi,
                        rekeningSimpanan: $wajibRekening,
                        batchId: $batch->id,
                        jumlah: $wajibAccepted,
                        userId: $userId,
                        keterangan: $data['simpanan_wajib_keterangan'] ?? null,
                        createdAt: $timestamp,
                    );
                }
            }

            $sukarelaTotal = round($sukarelaInput + $overflowToSukarela, 2);
            if ($sukarelaTotal > 0) {
                $sukarelaJenis = $jenisByKode['SUKARELA'];
                $sukarelaRekening = $this->firstOrCreateRekeningSimpanan($anggotaId, $sukarelaJenis->id);
                $this->validateInputAmount('sukarela', $sukarelaTotal, $sukarelaJenis, false);
                $this->assertSaldoWithinMaximum('sukarela', $sukarelaRekening, $sukarelaJenis, $sukarelaTotal);

                if ($sukarelaInput > 0) {
                    $createdTransactions[] = $this->createSimpananAndKas(
                        rekeningKoperasi: $rekeningKoperasi,
                        rekeningSimpanan: $sukarelaRekening,
                        batchId: $batch->id,
                        jumlah: $sukarelaInput,
                        userId: $userId,
                        keterangan: $data['simpanan_sukarela_keterangan'] ?? null,
                        createdAt: $timestamp,
                    );
                }

                if ($overflowToSukarela > 0) {
                    $createdTransactions[] = $this->createSimpananAndKas(
                        rekeningKoperasi: $rekeningKoperasi,
                        rekeningSimpanan: $sukarelaRekening,
                        batchId: $batch->id,
                        jumlah: $overflowToSukarela,
                        userId: $userId,
                        keterangan: $this->buildPengalihanWajibKeterangan(
                            $data['simpanan_wajib_keterangan'] ?? null,
                        ),
                        createdAt: $timestamp,
                    );
                }
            }

            if (count($createdTransactions) === 0) {
                throw new RuntimeException('Tidak ada transaksi simpanan yang dapat diproses.');
            }

            $batch->total = round(
                collect($createdTransactions)->sum(
                    static fn (Simpanan $item): float => (float) $item->jumlah,
                ),
                2,
            );
            $batch->save();

            /** @var Simpanan $lastTransaction */
            $lastTransaction = end($createdTransactions);

            return $lastTransaction;
        });
    }

    public function update(Simpanan $simpanan, array $data): Simpanan
    {
        return DB::transaction(function () use ($simpanan, $data): Simpanan {
            $currentRekening = RekeningSimpanan::query()
                ->lockForUpdate()
                ->findOrFail($simpanan->rekening_simpanan_id);

            $originalDelta = $this->toDelta(
                $simpanan->jenis_transaksi,
                $this->toAmount($simpanan->jumlah),
            );

            $this->applyDelta($currentRekening, -$originalDelta);

            $targetRekening = $data['rekening_simpanan_id'] === $currentRekening->id
                ? $currentRekening
                : RekeningSimpanan::query()
                    ->lockForUpdate()
                    ->findOrFail($data['rekening_simpanan_id']);

            $newJumlah = $this->toAmount($data['jumlah']);
            $newDelta = $this->toDelta($data['jenis_transaksi'], $newJumlah);

            $this->applyDelta($targetRekening, $newDelta);

            $simpanan->fill([
                'rekening_simpanan_id' => $targetRekening->id,
                'jenis_transaksi' => $data['jenis_transaksi'],
                'jumlah' => $newJumlah,
                'keterangan' => $this->normalizeText($data['keterangan'] ?? null),
                'created_at' => Carbon::parse($data['created_at'] ?? now()),
            ]);
            $simpanan->save();

            return $simpanan->refresh();
        });
    }

    public function tarikSukarela(array $data): Simpanan
    {
        return DB::transaction(function () use ($data): Simpanan {
            $timestamp = Carbon::parse((string) ($data['created_at'] ?? now()));
            $jumlah = $this->toAmount($data['jumlah']);
            $userId = isset($data['user_id']) ? (string) $data['user_id'] : '';

            if ($userId === '') {
                throw new RuntimeException('User login tidak ditemukan untuk membuat batch transaksi simpanan.');
            }

            if ($jumlah <= 0) {
                throw new RuntimeException('Nominal tarik harus lebih dari 0.');
            }

            $batch = $this->createBatchTransaksiSimpanan(
                anggotaId: (string) $data['anggota_id'],
                userId: $userId,
                tanggalTransaksi: $timestamp,
                total: $jumlah,
            );

            $rekeningKoperasi = RekeningKoperasi::query()
                ->lockForUpdate()
                ->findOrFail($data['rekening_koperasi_id']);

            $saldoKasSaatIni = (float) $rekeningKoperasi->saldo;
            if ($saldoKasSaatIni < $jumlah) {
                throw new RuntimeException('Saldo rekening koperasi tidak mencukupi untuk transaksi tarik.');
            }

            $sukarelaJenis = $this->getJenisSimpananByKode()['SUKARELA'];
            $rekeningSukarela = RekeningSimpanan::query()
                ->where('anggota_id', $data['anggota_id'])
                ->where('jenis_simpanan_id', $sukarelaJenis->id)
                ->lockForUpdate()
                ->first();

            if ($rekeningSukarela === null) {
                throw new RuntimeException('Anggota belum memiliki rekening simpanan sukarela.');
            }

            $saldoSukarelaSaatIni = (float) $rekeningSukarela->saldo;
            if ($saldoSukarelaSaatIni < $jumlah) {
                throw new RuntimeException('Saldo simpanan sukarela anggota tidak mencukupi untuk ditarik.');
            }

            $keterangan = $this->normalizeText($data['keterangan'] ?? null);

            $rekeningSukarela->saldo = round($saldoSukarelaSaatIni - $jumlah, 2);
            $rekeningSukarela->save();

            $transaksiSimpanan = Simpanan::query()->create([
                'rekening_simpanan_id' => $rekeningSukarela->id,
                'batch_id' => $batch->id,
                'jenis_transaksi' => 'tarik',
                'jumlah' => $jumlah,
                'keterangan' => $keterangan,
                'created_at' => $timestamp,
            ]);

            $rekeningKoperasi->saldo = round($saldoKasSaatIni - $jumlah, 2);
            $rekeningKoperasi->save();

            TransaksiKasKoperasi::query()->create([
                'rekening_koperasi_id' => $rekeningKoperasi->id,
                'jenis' => 'keluar',
                'jumlah' => $jumlah,
                'sumber_tipe' => 'simpanan',
                'sumber_id' => $transaksiSimpanan->id,
                'user_id' => $userId,
                'keterangan' => $keterangan,
                'created_at' => $timestamp,
            ]);

            return $transaksiSimpanan;
        });
    }

    public function delete(Simpanan $simpanan): void
    {
        DB::transaction(function () use ($simpanan): void {
            $rekening = RekeningSimpanan::query()
                ->lockForUpdate()
                ->findOrFail($simpanan->rekening_simpanan_id);

            $transaksiKas = TransaksiKasKoperasi::query()
                ->where('sumber_tipe', 'simpanan')
                ->where('sumber_id', $simpanan->id)
                ->first();

            if ($transaksiKas !== null) {
                $rekeningKoperasi = RekeningKoperasi::query()
                    ->lockForUpdate()
                    ->findOrFail($transaksiKas->rekening_koperasi_id);

                $rekeningKoperasi->saldo = round(
                    (float) $rekeningKoperasi->saldo - (float) $transaksiKas->jumlah,
                    2,
                );
                $rekeningKoperasi->save();
                $transaksiKas->delete();
            }

            $delta = $this->toDelta(
                $simpanan->jenis_transaksi,
                $this->toAmount($simpanan->jumlah),
            );

            $this->applyDelta($rekening, -$delta);
            $simpanan->delete();
        });
    }

    private function toAmount(mixed $value): float
    {
        return round((float) $value, 2);
    }

    private function toNullableAmount(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return round((float) $value, 2);
    }

    private function toDelta(string $jenisTransaksi, float $jumlah): float
    {
        return $jenisTransaksi === 'setor' ? $jumlah : -$jumlah;
    }

    private function applyDelta(RekeningSimpanan $rekening, float $delta): void
    {
        $nextSaldo = round((float) $rekening->saldo + $delta, 2);

        if ($nextSaldo < 0) {
            throw new RuntimeException('Saldo rekening simpanan tidak mencukupi untuk transaksi tarik.');
        }

        $rekening->saldo = $nextSaldo;
        $rekening->save();
    }

    private function normalizeText(?string $value): ?string
    {
        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    private function buildPengalihanWajibKeterangan(?string $wajibKeterangan): string
    {
        $inputText = $this->normalizeText($wajibKeterangan);

        if ($inputText === null) {
            return 'pengalihan dana dari simpanan wajib';
        }

        return "pengalihan dana dari simpanan wajib ({$inputText})";
    }

    /**
     * @return array<string, JenisSimpanan>
     */
    private function getJenisSimpananByKode(): array
    {
        $jenis = JenisSimpanan::query()
            ->whereIn(DB::raw('UPPER(kode)'), ['POKOK', 'WAJIB', 'SUKARELA'])
            ->get();

        $mapped = [];
        foreach ($jenis as $item) {
            $mapped[strtoupper((string) $item->kode)] = $item;
        }

        foreach (['POKOK', 'WAJIB', 'SUKARELA'] as $kode) {
            if (!isset($mapped[$kode])) {
                throw new RuntimeException("Jenis simpanan dengan kode {$kode} belum tersedia.");
            }
        }

        return $mapped;
    }

    private function firstOrCreateRekeningSimpanan(string $anggotaId, int $jenisSimpananId): RekeningSimpanan
    {
        $rekening = RekeningSimpanan::query()
            ->where('anggota_id', $anggotaId)
            ->where('jenis_simpanan_id', $jenisSimpananId)
            ->lockForUpdate()
            ->first();

        if ($rekening !== null) {
            return $rekening;
        }

        return RekeningSimpanan::query()->create([
            'anggota_id' => $anggotaId,
            'jenis_simpanan_id' => $jenisSimpananId,
            'saldo' => 0,
        ]);
    }

    private function validateInputAmount(string $label, float $amount, JenisSimpanan $jenis, bool $required): void
    {
        if (!$required && $amount <= 0) {
            return;
        }

        $min = $jenis->jumlah_minimum !== null ? (float) $jenis->jumlah_minimum : null;
        $max = $jenis->jumlah_maksimum !== null ? (float) $jenis->jumlah_maksimum : null;

        if ($min !== null && $amount < $min) {
            throw new RuntimeException("Nominal simpanan {$label} minimal Rp ".number_format($min, 0, ',', '.').'.');
        }

        if ($max !== null && $amount > $max) {
            throw new RuntimeException("Nominal simpanan {$label} maksimal Rp ".number_format($max, 0, ',', '.').'.');
        }
    }

    private function assertSaldoWithinMaximum(
        string $label,
        RekeningSimpanan $rekening,
        JenisSimpanan $jenis,
        float $amount,
    ): void {
        if ($amount <= 0) {
            return;
        }

        $max = $jenis->jumlah_maksimum !== null ? (float) $jenis->jumlah_maksimum : null;

        if ($max === null) {
            return;
        }

        $nextSaldo = round((float) $rekening->saldo + $amount, 2);

        if ($nextSaldo > $max) {
            throw new RuntimeException("Saldo simpanan {$label} melebihi batas maksimal Rp ".number_format($max, 0, ',', '.').'.');
        }
    }

    /**
     * @return array{0: float, 1: float}
     */
    private function splitWajibAmount(
        RekeningSimpanan $rekening,
        JenisSimpanan $jenis,
        float $inputAmount,
        bool $allowOverflowTransfer,
    ): array {
        $max = $jenis->jumlah_maksimum !== null ? (float) $jenis->jumlah_maksimum : null;

        if ($max === null) {
            return [$inputAmount, 0.0];
        }

        $saldoSaatIni = round((float) $rekening->saldo, 2);

        if ($saldoSaatIni >= $max) {
            if (!$allowOverflowTransfer) {
                throw new PerluKonfirmasiAlihSisaWajibException('Saldo simpanan wajib sudah penuh. Lanjutkan dengan mengalihkan setoran ke simpanan sukarela?');
            }

            return [0.0, $inputAmount];
        }

        $remaining = round($max - $saldoSaatIni, 2);
        if ($inputAmount <= $remaining) {
            return [$inputAmount, 0.0];
        }

        if (!$allowOverflowTransfer) {
            throw new PerluKonfirmasiAlihSisaWajibException('Setoran simpanan wajib melebihi batas maksimal saldo. Lanjutkan dengan mengalihkan sisa ke simpanan sukarela?');
        }

        return [$remaining, round($inputAmount - $remaining, 2)];
    }

    private function createSimpananAndKas(
        RekeningKoperasi $rekeningKoperasi,
        RekeningSimpanan $rekeningSimpanan,
        string $batchId,
        float $jumlah,
        string $userId,
        ?string $keterangan,
        Carbon $createdAt,
    ): Simpanan {
        $keteranganClean = $this->normalizeText($keterangan);

        $rekeningSimpanan->saldo = round((float) $rekeningSimpanan->saldo + $jumlah, 2);
        $rekeningSimpanan->save();

        $transaksiSimpanan = Simpanan::query()->create([
            'rekening_simpanan_id' => $rekeningSimpanan->id,
            'batch_id' => $batchId,
            'jenis_transaksi' => 'setor',
            'jumlah' => $jumlah,
            'keterangan' => $keteranganClean,
            'created_at' => $createdAt,
        ]);

        $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo + $jumlah, 2);
        $rekeningKoperasi->save();

        TransaksiKasKoperasi::query()->create([
            'rekening_koperasi_id' => $rekeningKoperasi->id,
            'jenis' => 'masuk',
            'jumlah' => $jumlah,
            'sumber_tipe' => 'simpanan',
            'sumber_id' => $transaksiSimpanan->id,
            'user_id' => $userId,
            'keterangan' => $keteranganClean,
            'created_at' => $createdAt,
        ]);

        return $transaksiSimpanan;
    }

    private function createBatchTransaksiSimpanan(
        string $anggotaId,
        string $userId,
        Carbon $tanggalTransaksi,
        float $total,
    ): TransaksiSimpananBatch {
        return TransaksiSimpananBatch::query()->create([
            'kode_transaksi' => $this->generateKodeBatchSimpanan($tanggalTransaksi),
            'anggota_id' => $anggotaId,
            'tanggal_transaksi' => $tanggalTransaksi,
            'user_id' => $userId,
            'total' => round($total, 2),
        ]);
    }

    private function generateKodeBatchSimpanan(Carbon $tanggalTransaksi): string
    {
        $prefix = 'SIM-'.$tanggalTransaksi->format('Ymd').'-';

        $lastKode = TransaksiSimpananBatch::query()
            ->where('kode_transaksi', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('kode_transaksi')
            ->value('kode_transaksi');

        $lastSequence = 0;
        if (is_string($lastKode) && str_starts_with($lastKode, $prefix)) {
            $lastSequence = (int) substr($lastKode, -6);
        }

        return $prefix.str_pad((string) ($lastSequence + 1), 6, '0', STR_PAD_LEFT);
    }
}