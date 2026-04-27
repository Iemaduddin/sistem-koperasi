<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\JenisSimpanan;
use App\Models\RekeningKoperasi;
use App\Models\RekeningSimpanan;
use App\Models\RiwayatKeluarAnggota;
use App\Models\Simpanan;
use App\Models\TransaksiKasKoperasi;
use App\Models\TransaksiSimpananBatch;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AnggotaService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAnggotaIndexData(): array
    {
        return Anggota::query()
            ->with([
                'riwayatKeluar' => fn ($query) => $query
                    ->with('disetujuiOleh')
                    ->orderByDesc('created_at'),
            ])
            ->orderBy('nama')
            ->get()
            ->map(function (Anggota $item): array {
                $riwayatKeluarTerakhir = $item->riwayatKeluar->first();

                return [
                    'id' => $item->id,
                    'no_anggota' => $item->no_anggota,
                    'nik' => $item->nik,
                    'nama' => $item->nama,
                    'alamat' => $item->alamat,
                    'no_hp' => $item->no_hp,
                    'no_hp_cadangan' => $item->no_hp_cadangan,
                    'status' => $item->status,
                    'tanggal_bergabung' => $item->tanggal_bergabung?->toDateString(),
                    'tanggal_keluar' => $item->tanggal_keluar?->toDateString(),
                    'riwayat_keluar' => $riwayatKeluarTerakhir ? [
                        'alasan_keluar' => $riwayatKeluarTerakhir->alasan_keluar,
                        'tanggal_pengajuan' => $riwayatKeluarTerakhir->tanggal_pengajuan?->toDateString(),
                        'tanggal_disetujui' => $riwayatKeluarTerakhir->tanggal_disetujui?->toDateString(),
                        'disetujui_oleh' => $riwayatKeluarTerakhir->disetujuiOleh?->name,
                    ] : null,
                    'created_at' => $item->created_at?->toDateTimeString(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    public function getStatusOptions(): array
    {
        return ['aktif', 'nonaktif', 'keluar'];
    }

    /**
     * @return array<int, array{id: string, nama: string, jenis: string, nomor_rekening: string|null, saldo: string}>
     */
    public function getRekeningKoperasiOptions(): array
    {
        return RekeningKoperasi::query()
            ->orderBy('nama')
            ->get(['id', 'nama', 'jenis', 'nomor_rekening', 'saldo'])
            ->map(static fn (RekeningKoperasi $rekening): array => [
                'id' => $rekening->id,
                'nama' => (string) $rekening->nama,
                'jenis' => (string) $rekening->jenis,
                'nomor_rekening' => $rekening->nomor_rekening,
                'saldo' => (string) $rekening->saldo,
            ])
            ->values()
            ->all();
    }

    public function getPreferredRekeningKoperasiForAnggota(Anggota $anggota): ?string
    {
        $anggotaId = $anggota->id;
        
        // Cari transaksi kas koperasi terbaru yang bersumber dari transaksi simpanan milik anggota
        $transaksiTerbaru = TransaksiKasKoperasi::query()
            ->where('sumber_tipe', 'simpanan')
            ->whereRaw(
                '`sumber_id` IN (
                    SELECT ts.id FROM `transaksi_simpanan` ts
                    INNER JOIN `rekening_simpanan` rs ON ts.`rekening_simpanan_id` = rs.`id`
                    WHERE rs.`anggota_id` = ?
                )',
                [$anggotaId]
            )
            ->orderByDesc('created_at')
            ->first(['rekening_koperasi_id']);

        return $transaksiTerbaru?->rekening_koperasi_id;
    }

    /**
     * @return array{pokok: string, wajib: string, sukarela: string}
     */
    public function getSaldoSimpananAnggota(Anggota $anggota): array
    {
        $anggotaId = $anggota->id;
        
        $rekeningSimpanan = RekeningSimpanan::query()
            ->where('anggota_id', $anggotaId)
            ->with('jenisSimpanan')
            ->get();

        $saldoPokok = '0';
        $saldoWajib = '0';
        $saldoSukarela = '0';

        foreach ($rekeningSimpanan as $rekening) {
            $kode = strtoupper((string) $rekening->jenisSimpanan?->kode);
            $saldo = (string) round((float) $rekening->saldo, 2);

            if ($kode === 'POKOK') {
                $saldoPokok = $saldo;
            } elseif ($kode === 'WAJIB') {
                $saldoWajib = $saldo;
            } elseif ($kode === 'SUKARELA') {
                $saldoSukarela = $saldo;
            }
        }

        return [
            'pokok' => $saldoPokok,
            'wajib' => $saldoWajib,
            'sukarela' => $saldoSukarela,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function createAnggota(array $payload): Anggota
    {
        return DB::transaction(function () use ($payload): Anggota {
            $providedNoAnggota = trim((string) ($payload['no_anggota'] ?? ''));

            if ($providedNoAnggota === '') {
                $joinDate = isset($payload['tanggal_bergabung'])
                    ? Carbon::parse((string) $payload['tanggal_bergabung'])
                    : now();

                $prefix = $joinDate->format('my');
                $nextSequence = $this->getNextNoAnggotaSequence();

                $payload['no_anggota'] = $prefix.str_pad(
                    (string) $nextSequence,
                    2,
                    '0',
                    STR_PAD_LEFT,
                );
            } else {
                $payload['no_anggota'] = $providedNoAnggota;
            }

            $payload = $this->normalizeAnggotaPayload($payload);

            /** @var Anggota $anggota */
            $anggota = Anggota::query()->create($payload);

            return $anggota;
        });
    }

    private function getNextNoAnggotaSequence(): int
    {
        $lastSequence = Anggota::query()
            ->lockForUpdate()
            ->selectRaw("MAX(CAST(SUBSTRING(REPLACE(no_anggota, '.', ''), 5) AS UNSIGNED)) as last_sequence")
            ->value('last_sequence');

        return ((int) $lastSequence) + 1;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function normalizeAnggotaPayload(array $payload): array
    {
        $noAnggota = $this->formatNoAnggota(trim((string) ($payload['no_anggota'] ?? '')));
        $nik = trim((string) ($payload['nik'] ?? ''));
        $alamat = trim((string) ($payload['alamat'] ?? ''));
        $noHp = trim((string) ($payload['no_hp'] ?? ''));

        $payload['no_anggota'] = $noAnggota;

        $payload['nik'] = $nik !== '' ? $nik : $this->generateUniqueNik($noAnggota);
        $payload['alamat'] = $alamat !== '' ? $alamat : '-';
        $payload['no_hp'] = $noHp !== '' ? $noHp : '0000000000';
        $payload['no_hp_cadangan'] = isset($payload['no_hp_cadangan']) && trim((string) $payload['no_hp_cadangan']) !== ''
            ? trim((string) $payload['no_hp_cadangan'])
            : null;

        return $payload;
    }

    private function formatNoAnggota(string $value): string
    {
        $digits = preg_replace('/\D/', '', $value) ?? '';

        if ($digits === '') {
            return '';
        }

        if (strlen($digits) <= 2) {
            return $digits;
        }

        if (strlen($digits) <= 4) {
            return substr($digits, 0, 2).'.'.substr($digits, 2);
        }

        return substr($digits, 0, 2).'.'.substr($digits, 2, 2).'.'.substr($digits, 4);
    }

    private function generateUniqueNik(string $noAnggota): string
    {
        $digits = preg_replace('/\D/', '', $noAnggota) ?? '';
        $digits = str_pad(substr($digits, -12), 12, '0', STR_PAD_LEFT);
        $prefix = '88' . $digits;
        $counter = 0;

        while (true) {
            $suffix = str_pad((string) $counter, 2, '0', STR_PAD_LEFT);
            $candidate = $prefix . $suffix;

            if (!Anggota::query()->where('nik', $candidate)->exists()) {
                return $candidate;
            }

            $counter++;
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function updateAnggota(Anggota $anggota, array $payload): Anggota
    {
        if (!isset($payload['no_anggota']) || trim((string) $payload['no_anggota']) === '') {
            $payload['no_anggota'] = $anggota->no_anggota;
        }

        $payload = $this->normalizeAnggotaPayload($payload);

        $anggota->update($payload);

        return $anggota;
    }

    public function deleteAnggota(Anggota $anggota): void
    {
        $anggota->delete();
    }

    /**
     * @param array{alasan_keluar: string, tanggal_keluar: string, rekening_koperasi_id: string} $payload
     */
    public function setKeluar(Anggota $anggota, array $payload, ?string $approvedBy): void
    {
        DB::transaction(function () use ($anggota, $payload, $approvedBy): void {
            $tanggalKeluar = Carbon::parse((string) $payload['tanggal_keluar']);
            $userId = (string) ($approvedBy ?? '');

            if ($userId === '') {
                throw new RuntimeException('User login tidak ditemukan untuk membuat batch transaksi simpanan.');
            }

            $rekeningKoperasi = RekeningKoperasi::query()
                ->lockForUpdate()
                ->findOrFail((string) $payload['rekening_koperasi_id']);

            $batch = $this->createBatchTransaksiSimpanan(
                anggotaId: $anggota->id,
                userId: $userId,
                tanggalTransaksi: $tanggalKeluar,
                total: 0,
            );

            $anggota->update([
                'status' => 'keluar',
                'tanggal_keluar' => $tanggalKeluar,
            ]);

            RiwayatKeluarAnggota::query()->create([
                'anggota_id' => $anggota->id,
                'alasan_keluar' => $payload['alasan_keluar'],
                'tanggal_pengajuan' => $tanggalKeluar,
                'tanggal_disetujui' => $tanggalKeluar,
                'disetujui_oleh' => $approvedBy,
                'created_at' => now(),
            ]);

            $totalTarik = $this->tarikSimpananSaatKeluar($anggota, $rekeningKoperasi, $batch->id, $tanggalKeluar);
            $batch->total = round($totalTarik, 2);
            $batch->save();
        });
    }

    private function tarikSimpananSaatKeluar(
        Anggota $anggota,
        RekeningKoperasi $rekeningKoperasi,
        string $batchId,
        Carbon $tanggalKeluar,
    ): float
    {
        $jenisSimpanan = JenisSimpanan::query()
            ->whereIn(DB::raw('UPPER(kode)'), ['POKOK', 'WAJIB', 'SUKARELA'])
            ->get();

        $jenisByKode = [];
        foreach ($jenisSimpanan as $jenis) {
            $jenisByKode[strtoupper((string) $jenis->kode)] = $jenis;
        }

        $totalTarik = 0.0;

        foreach (['POKOK', 'WAJIB', 'SUKARELA'] as $kode) {
            if (!isset($jenisByKode[$kode])) {
                throw new RuntimeException("Jenis simpanan dengan kode {$kode} belum tersedia.");
            }
        }

        foreach (['POKOK', 'WAJIB', 'SUKARELA'] as $kode) {
            /** @var JenisSimpanan $jenis */
            $jenis = $jenisByKode[$kode];

            $rekeningSimpanan = RekeningSimpanan::query()
                ->where('anggota_id', $anggota->id)
                ->where('jenis_simpanan_id', $jenis->id)
                ->lockForUpdate()
                ->first();

            if ($rekeningSimpanan === null) {
                continue;
            }

            $jumlahTarik = round((float) $rekeningSimpanan->saldo, 2);
            if ($jumlahTarik <= 0) {
                continue;
            }

            $this->createPenarikanSimpananDanKas(
                rekeningKoperasi: $rekeningKoperasi,
                rekeningSimpanan: $rekeningSimpanan,
                batchId: $batchId,
                jumlah: $jumlahTarik,
                keterangan: "Penarikan otomatis simpanan {$kode} karena anggota keluar",
                createdAt: $tanggalKeluar,
            );

            $totalTarik += $jumlahTarik;
        }

        return $totalTarik;
    }

    private function createPenarikanSimpananDanKas(
        RekeningKoperasi $rekeningKoperasi,
        RekeningSimpanan $rekeningSimpanan,
        string $batchId,
        float $jumlah,
        string $keterangan,
        Carbon $createdAt,
    ): void {
        $saldoKasSaatIni = (float) $rekeningKoperasi->saldo;
        if ($saldoKasSaatIni < $jumlah) {
            throw new RuntimeException('Saldo rekening koperasi tidak mencukupi untuk penarikan otomatis simpanan anggota keluar.');
        }

        $rekeningSimpanan->saldo = round((float) $rekeningSimpanan->saldo - $jumlah, 2);
        $rekeningSimpanan->save();

        $transaksiSimpanan = Simpanan::query()->create([
            'rekening_simpanan_id' => $rekeningSimpanan->id,
            'batch_id' => $batchId,
            'jenis_transaksi' => 'tarik',
            'jumlah' => $jumlah,
            'keterangan' => $keterangan,
            'created_at' => $createdAt,
        ]);

        $rekeningKoperasi->saldo = round($saldoKasSaatIni - $jumlah, 2);
        $rekeningKoperasi->save();

        TransaksiKasKoperasi::query()->create([
            'rekening_koperasi_id' => $rekeningKoperasi->id,
            'jenis' => 'keluar',
            'jumlah' => $jumlah,
            'sumber_tipe' => 'simpanan',
            'sumber_id' => $transaksiSimpanan->id,
            'keterangan' => $keterangan,
            'created_at' => $createdAt,
        ]);
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
