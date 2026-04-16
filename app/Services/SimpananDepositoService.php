<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\JenisSimpanan;
use App\Models\LogBagiHasilDeposito;
use App\Models\RekeningKoperasi;
use App\Models\RekeningSimpanan;
use App\Models\SimpananDeposito;
use App\Models\TransaksiKasKoperasi;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SimpananDepositoService
{
    /**
     * @return array{
     *   simpanan_deposito: Collection<int, SimpananDeposito>,
     *   rekening_koperasi: Collection<int, RekeningKoperasi>,
     *   anggota: Collection<int, Anggota>,
     *   rekening_simpanan: Collection<int, RekeningSimpanan>,
     *   jenis_simpanan: Collection<int, JenisSimpanan>
     * }
     */
    public function getIndexData(): array
    {
        return [
            'simpanan_deposito' => SimpananDeposito::query()
                ->with(['anggota', 'rekeningKoperasi', 'logBagiHasil'])
                ->latest('created_at')
                ->get(),
            'rekening_koperasi' => RekeningKoperasi::query()
                ->orderBy('nama')
                ->get(['id', 'nama', 'jenis', 'nomor_rekening', 'saldo']),
            'anggota' => Anggota::query()
                ->where('status', 'aktif')
                ->orderBy('nama')
                ->get(['id', 'no_anggota', 'nama', 'alamat']),
            'rekening_simpanan' => RekeningSimpanan::query()
                ->with(['jenisSimpanan'])
                ->get(['id', 'anggota_id', 'jenis_simpanan_id', 'saldo']),
            'jenis_simpanan' => JenisSimpanan::query()
                ->whereIn(DB::raw('UPPER(kode)'), ['POKOK', 'WAJIB'])
                ->get(['id', 'kode', 'nama', 'jumlah_minimum']),
        ];
    }

    public function create(array $data): SimpananDeposito
    {
        return DB::transaction(function () use ($data): SimpananDeposito {
            $saldo = round((float) $data['saldo'], 2);
            $tenorBulan = (int) $data['tenor_bulan'];
            $persenBagiHasil = $tenorBulan === 6 ? 0.6 : 0.8;
            $tanggalMulai = Carbon::parse((string) ($data['tanggal_mulai'] ?? now()))->startOfDay();
            $tanggalSelesai = $tanggalMulai->copy()->addMonthsNoOverflow($tenorBulan);
            $nominalBagiHasilBulanan = round($saldo * ($persenBagiHasil / 100), 2);
            $timestamp = Carbon::parse((string) ($data['created_at'] ?? now()));

            $rekeningKoperasi = RekeningKoperasi::query()
                ->lockForUpdate()
                ->findOrFail((string) $data['rekening_koperasi_id']);

            $deposito = SimpananDeposito::query()->create([
                'anggota_id' => (string) $data['anggota_id'],
                'rekening_koperasi_id' => $rekeningKoperasi->id,
                'saldo' => $saldo,
                'persen_bagi_hasil' => $persenBagiHasil,
                'tenor_bulan' => $tenorBulan,
                'tanggal_mulai' => $tanggalMulai,
                'tanggal_selesai' => $tanggalSelesai,
                'status' => 'aktif',
                'created_at' => $timestamp,
            ]);

            $logs = [];
            for ($bulan = 1; $bulan <= $tenorBulan; $bulan++) {
                $logs[] = [
                    'simpanan_deposito_id' => $deposito->id,
                    'nominal_bagi_hasil' => $nominalBagiHasilBulanan,
                    'tanggal_perhitungan' => $tanggalMulai->copy()->addMonthsNoOverflow($bulan),
                    'status_pengambilan' => 'belum',
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }

            LogBagiHasilDeposito::query()->insert($logs);

            $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo + $saldo, 2);
            $rekeningKoperasi->save();

            TransaksiKasKoperasi::query()->create([
                'rekening_koperasi_id' => $rekeningKoperasi->id,
                'jenis' => 'masuk',
                'jumlah' => $saldo,
                'sumber_tipe' => 'deposito',
                'sumber_id' => $deposito->id,
                'user_id' => $data['user_id'] ?? null,
                'keterangan' => $this->buildKeterangan($tenorBulan, $data['keterangan'] ?? null),
                'created_at' => $timestamp,
            ]);

            return $deposito->load(['anggota', 'logBagiHasil']);
        });
    }

    public function tarikBagiHasil(int $logId, ?string $userId = null): LogBagiHasilDeposito
    {
        return DB::transaction(function () use ($logId, $userId): LogBagiHasilDeposito {
            $log = LogBagiHasilDeposito::query()
                ->with('simpananDeposito.rekeningKoperasi')
                ->lockForUpdate()
                ->findOrFail($logId);

            $this->assertLogDapatDitarik($log);

            $this->processCashWithdrawal(
                deposito: $log->simpananDeposito,
                jumlah: (float) $log->nominal_bagi_hasil,
                keterangan: $this->buildWithdrawalKeteranganSingle($log),
                userId: $userId,
            );

            $log->status_pengambilan = 'sudah';
            $log->tanggal_pengambilan = Carbon::now();
            $log->save();

            return $log;
        });
    }

    /**
     * @param  array<int, int|string>  $logIds
     */
    public function tarikBagiHasilKumulatif(string $depositoId, array $logIds, ?string $userId = null): int
    {
        return DB::transaction(function () use ($depositoId, $logIds, $userId): int {
            $normalizedIds = collect($logIds)
                ->map(static fn (int|string $id): int => (int) $id)
                ->filter(static fn (int $id): bool => $id > 0)
                ->unique()
                ->values();

            if ($normalizedIds->isEmpty()) {
                throw new RuntimeException('Tidak ada data log bagi hasil yang dipilih.');
            }

            $logs = LogBagiHasilDeposito::query()
                ->with('simpananDeposito.rekeningKoperasi')
                ->where('simpanan_deposito_id', $depositoId)
                ->whereIn('id', $normalizedIds)
                ->lockForUpdate()
                ->get();

            if ($logs->isEmpty()) {
                throw new RuntimeException('Data log bagi hasil tidak ditemukan.');
            }

            $deposito = $logs->first()?->simpananDeposito;
            if ($deposito === null) {
                throw new RuntimeException('Data deposito tidak ditemukan.');
            }

            $totalWithdrawal = 0.0;
            foreach ($logs as $log) {
                if ($log->status_pengambilan === 'sudah') {
                    continue;
                }

                $this->assertLogDapatDitarik($log);
                $totalWithdrawal += (float) $log->nominal_bagi_hasil;
            }

            if ($totalWithdrawal <= 0) {
                throw new RuntimeException('Tidak ada log yang dapat ditarik.');
            }

            $this->processCashWithdrawal(
                deposito: $deposito,
                jumlah: $totalWithdrawal,
                keterangan: $this->buildWithdrawalKeteranganKumulatif($depositoId, $logs->count()),
                userId: $userId,
            );

            $updatedCount = 0;
            foreach ($logs as $log) {
                if ($log->status_pengambilan === 'sudah') {
                    continue;
                }

                $this->assertLogDapatDitarik($log);

                $log->status_pengambilan = 'sudah';
                $log->tanggal_pengambilan = Carbon::now();
                $log->save();
                $updatedCount++;
            }

            return $updatedCount;
        });
    }

    private function assertLogDapatDitarik(LogBagiHasilDeposito $log): void
    {
        if ($log->status_pengambilan === 'sudah') {
            throw new RuntimeException('Bagi hasil untuk log ini sudah pernah ditarik.');
        }

        $tanggalPerhitungan = Carbon::parse((string) $log->tanggal_perhitungan)->startOfDay();
        if (Carbon::today()->lt($tanggalPerhitungan)) {
            throw new RuntimeException('Bagi hasil belum bisa ditarik sebelum tanggal perhitungan.');
        }
    }

    private function processCashWithdrawal(SimpananDeposito $deposito, float $jumlah, string $keterangan, ?string $userId): void
    {
        if ($jumlah <= 0) {
            throw new RuntimeException('Nominal penarikan tidak valid.');
        }

        $rekeningKoperasiId = $deposito->rekening_koperasi_id;
        if ($rekeningKoperasiId === null) {
            throw new RuntimeException('Rekening koperasi deposito belum ditentukan.');
        }

        $rekeningKoperasi = RekeningKoperasi::query()
            ->lockForUpdate()
            ->findOrFail($rekeningKoperasiId);

        $saldoSaatIni = (float) $rekeningKoperasi->saldo;
        if ($saldoSaatIni < $jumlah) {
            throw new RuntimeException('Saldo rekening koperasi tidak mencukupi untuk penarikan bagi hasil.');
        }

        $rekeningKoperasi->saldo = round($saldoSaatIni - $jumlah, 2);
        $rekeningKoperasi->save();

        $timestamp = Carbon::today()->setTimeFrom(Carbon::now());

        TransaksiKasKoperasi::query()->create([
            'rekening_koperasi_id' => $rekeningKoperasi->id,
            'jenis' => 'keluar',
            'jumlah' => round($jumlah, 2),
            'sumber_tipe' => 'deposito',
            'sumber_id' => $deposito->id,
            'user_id' => $userId,
            'keterangan' => $keterangan,
            'created_at' => $timestamp,
        ]);
    }

    private function buildWithdrawalKeteranganSingle(LogBagiHasilDeposito $log): string
    {
        $tanggal = Carbon::parse((string) $log->tanggal_perhitungan)->format('Y-m-d');

        return "Penarikan bagi hasil deposito tanggal perhitungan {$tanggal}";
    }

    private function buildWithdrawalKeteranganKumulatif(string $depositoId, int $jumlahLog): string
    {
        return "Penarikan kumulatif bagi hasil deposito {$depositoId} ({$jumlahLog} log)";
    }

    private function buildKeterangan(int $tenorBulan, mixed $keterangan): string
    {
        $catatan = trim((string) $keterangan);

        if ($catatan === '') {
            return "Setoran simpanan deposito tenor {$tenorBulan} bulan";
        }

        return "Setoran simpanan deposito tenor {$tenorBulan} bulan ({$catatan})";
    }
}
