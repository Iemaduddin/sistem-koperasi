<?php

namespace App\Services;

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

class TabunganService
{
    /**
     * @return array{tabungan: Collection<int, Simpanan>, rekening_koperasi: Collection<int, RekeningKoperasi>}
     */
    public function getIndexData(): array
    {
        $tabunganJenis = $this->getJenisSimpananByKode()['TABUNGAN'];

        return [
            // Use pagination to avoid loading all rows at once and limit eager-loaded fields
            'tabungan' => Simpanan::query()
                ->whereHas('rekeningSimpanan', function ($q) use ($tabunganJenis) {
                    $q->where('jenis_simpanan_id', $tabunganJenis->id);
                })
                ->with([
                    'rekeningSimpanan' => function ($q) {
                        $q->with([
                            'anggota' => fn($q2) => $q2->select('id', 'no_anggota', 'nama'),
                            'jenisSimpanan' => fn($q2) => $q2->select('id', 'kode', 'nama'),
                        ])->select('id', 'anggota_id', 'jenis_simpanan_id', 'saldo');
                    },
                    'batch' => function ($q) {
                        $q->with([
                            'anggota' => fn($q2) => $q2->select('id', 'no_anggota', 'nama'),
                            'user' => fn($q2) => $q2->select('id', 'name'),
                        ])->select('id', 'anggota_id', 'user_id', 'kode_transaksi', 'tanggal_transaksi');
                    },
                ])
                ->latest('created_at')
                ->paginate(25),
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
            ->get(['id', 'no_anggota', 'nama']);
    }

    /**
     * Get rekening koperasi for form dropdown (lazy load on-demand)
     * @return Collection<int, RekeningKoperasi>
     */
    public function getRekeningKoperasiForForm(): Collection
    {
        return RekeningKoperasi::query()
            ->orderBy('nama')
            ->get(['id', 'nama', 'jenis', 'nomor_rekening', 'saldo']);
    }

    public function create(array $data): Simpanan
    {
        return DB::transaction(function () use ($data): Simpanan {
            $timestamp = Carbon::parse((string) ($data['created_at'] ?? now()));
            $jumlah = $this->toAmount($data['jumlah']);
            $userId = isset($data['user_id']) ? (string) $data['user_id'] : '';

            if ($userId === '') {
                throw new RuntimeException('User login tidak ditemukan untuk membuat batch transaksi tabungan.');
            }

            if ($jumlah < 0) {
                throw new RuntimeException('Nominal tabungan tidak boleh negatif.');
            }

            $batch = $this->createBatchTransaksiTabungan(
                anggotaId: (string) $data['anggota_id'],
                userId: $userId,
                tanggalTransaksi: $timestamp,
                total: $jumlah,
            );

            $tabunganJenis = $this->getJenisSimpananByKode()['TABUNGAN'];
            $rekeningTabungan = $this->firstOrCreateRekeningTabungan(
                (string) $data['anggota_id'],
                $tabunganJenis->id,
            );

            $saldoTabunganSaatIni = (float) $rekeningTabungan->saldo;
            $keterangan = $this->normalizeText($data['keterangan'] ?? null);

            $rekeningTabungan->saldo = round($saldoTabunganSaatIni + $jumlah, 2);
            $rekeningTabungan->save();

            $transaksiTabungan = Simpanan::query()->create([
                'rekening_simpanan_id' => $rekeningTabungan->id,
                'batch_id' => $batch->id,
                'jenis_transaksi' => 'setor',
                'jumlah' => $jumlah,
                'keterangan' => $keterangan,
                'created_at' => $timestamp,
            ]);

            $rekeningKoperasi = RekeningKoperasi::query()
                ->lockForUpdate()
                ->findOrFail($data['rekening_koperasi_id']);

            $saldoKasSaatIni = (float) $rekeningKoperasi->saldo;
            $rekeningKoperasi->saldo = round($saldoKasSaatIni + $jumlah, 2);
            $rekeningKoperasi->save();

            TransaksiKasKoperasi::query()->create([
                'rekening_koperasi_id' => $rekeningKoperasi->id,
                'jenis' => 'masuk',
                'jumlah' => $jumlah,
                'sumber_tipe' => 'simpanan',
                'sumber_id' => $transaksiTabungan->id,
                'user_id' => $userId,
                'keterangan' => $keterangan,
                'created_at' => $timestamp,
            ]);

            return $transaksiTabungan;
        });
    }

    public function tarikTabungan(array $data): Simpanan
    {
        return DB::transaction(function () use ($data): Simpanan {
            $timestamp = Carbon::parse((string) ($data['created_at'] ?? now()));
            $jumlah = $this->toAmount($data['jumlah']);
            $userId = isset($data['user_id']) ? (string) $data['user_id'] : '';

            if ($userId === '') {
                throw new RuntimeException('User login tidak ditemukan untuk membuat batch transaksi tabungan.');
            }

            if ($jumlah <= 0) {
                throw new RuntimeException('Nominal tarik harus lebih dari 0.');
            }

            $batch = $this->createBatchTransaksiTabungan(
                anggotaId: (string) $data['anggota_id'],
                userId: $userId,
                tanggalTransaksi: $timestamp,
                total: $jumlah,
            );

            $rekeningKoperasi = RekeningKoperasi::query()
                ->lockForUpdate()
                ->findOrFail($data['rekening_koperasi_id']);

            $saldoKasSaatIni = (float) $rekeningKoperasi->saldo;
            // if ($saldoKasSaatIni < $jumlah) {
            //     throw new RuntimeException('Saldo rekening koperasi tidak mencukupi untuk transaksi tarik.');
            // }

            $tabunganJenis = $this->getJenisSimpananByKode()['TABUNGAN'];
            $rekeningTabungan = RekeningSimpanan::query()
                ->where('anggota_id', $data['anggota_id'])
                ->where('jenis_simpanan_id', $tabunganJenis->id)
                ->lockForUpdate()
                ->first();

            if ($rekeningTabungan === null) {
                throw new RuntimeException('Anggota belum memiliki rekening tabungan.');
            }

            $saldoTabunganSaatIni = (float) $rekeningTabungan->saldo;
            if ($saldoTabunganSaatIni < $jumlah) {
                throw new RuntimeException('Saldo tabungan anggota tidak mencukupi untuk ditarik.');
            }

            $keterangan = $this->normalizeText($data['keterangan'] ?? null);

            $rekeningTabungan->saldo = round($saldoTabunganSaatIni - $jumlah, 2);
            $rekeningTabungan->save();

            $transaksiTabungan = Simpanan::query()->create([
                'rekening_simpanan_id' => $rekeningTabungan->id,
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
                'sumber_id' => $transaksiTabungan->id,
                'user_id' => $userId,
                'keterangan' => $keterangan,
                'created_at' => $timestamp,
            ]);

            return $transaksiTabungan;
        });
    }

    private function toAmount(mixed $value): float
    {
        return round((float) $value, 2);
    }

    private function normalizeText(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim($value);
        return $normalized === '' ? null : $normalized;
    }

    private function createBatchTransaksiTabungan(
        string $anggotaId,
        string $userId,
        Carbon $tanggalTransaksi,
        float $total,
    ): TransaksiSimpananBatch {
        return TransaksiSimpananBatch::query()->create([
            'kode_transaksi' => $this->generateKodeBatchTabungan($tanggalTransaksi),
            'anggota_id' => $anggotaId,
            'tanggal_transaksi' => $tanggalTransaksi,
            'user_id' => $userId,
            'total' => round($total, 2),
        ]);
    }

    private function generateKodeBatchTabungan(Carbon $tanggalTransaksi): string
    {
        $prefix = 'TAB-'.$tanggalTransaksi->format('Ymd').'-';

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

    private function getJenisSimpananByKode(): array
    {
        $jenis = JenisSimpanan::query()
            ->whereIn(DB::raw('UPPER(kode)'), ['TABUNGAN'])
            ->get();

        $mapped = [];
        foreach ($jenis as $item) {
            $mapped[strtoupper((string) $item->kode)] = $item;
        }

        if (!isset($mapped['TABUNGAN'])) {
            throw new RuntimeException('Jenis simpanan dengan kode TABUNGAN belum tersedia.');
        }

        return $mapped;
    }

    private function firstOrCreateRekeningTabungan(string $anggotaId, int $jenisSimpananId): RekeningSimpanan
    {
        $rekening = RekeningSimpanan::query()
            ->where('anggota_id', $anggotaId)
            ->where('jenis_simpanan_id', $jenisSimpananId)
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
}
