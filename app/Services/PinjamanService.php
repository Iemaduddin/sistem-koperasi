<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\AngsuranPinjaman;
use App\Models\Pinjaman;
use App\Models\TransaksiPinjaman;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PinjamanService
{
    /**
     * Ambil data untuk halaman index pinjaman.
     *
     * @return array<string, mixed>
     */
    public function getIndexData(): array
    {
        return [
            'pinjaman' => Pinjaman::with([
                'anggota',
                'angsuran' => fn ($q) => $q->orderBy('angsuran_ke'),
            ])
                ->latest('created_at')
                ->get(),
            'anggota' => Anggota::query()
                ->where('status', 'aktif')
                ->orderBy('nama')
                ->get(['id', 'no_anggota', 'nama', 'alamat']),
            'rekening_koperasi' => \App\Models\RekeningKoperasi::query()
                ->orderBy('nama')
                ->get(['id', 'nama', 'jenis', 'nomor_rekening', 'saldo']),
        ];
    }

    /**
     * Ambil detail pinjaman beserta jadwal angsuran.
     *
     * @return array<string, mixed>
     */
    public function getDetailData(Pinjaman $pinjaman): array
    {
        $pinjaman->load([
            'anggota',
            'angsuran' => fn ($q) => $q->orderBy('angsuran_ke'),
            'angsuran.transaksi',
        ]);

        return [
            'pinjaman' => $pinjaman,
        ];
    }

    /**
     * Buat pinjaman baru + generate jadwal angsuran secara otomatis.
     */
    public function create(array $data): Pinjaman
    {
        return DB::transaction(function () use ($data): Pinjaman {
            $jumlah       = round((float) $data['jumlah_pinjaman'], 2);
            $bungaPersen  = round((float) $data['bunga_persen'], 2);
            $tenorBulan   = (int) $data['tenor_bulan'];
            $tanggalMulai = Carbon::parse((string) $data['tanggal_mulai']);

            if ($jumlah <= 0) {
                throw new RuntimeException('Jumlah pinjaman harus lebih dari 0.');
            }

            if ($tenorBulan <= 0) {
                throw new RuntimeException('Tenor harus lebih dari 0 bulan.');
            }

            $rekeningKoperasiId = $data['rekening_koperasi_id'] ?? null;
            if (!$rekeningKoperasiId) {
                throw new RuntimeException('Rekening koperasi wajib dipilih.');
            }

            $rekeningKoperasi = \App\Models\RekeningKoperasi::query()
                ->lockForUpdate()
                ->findOrFail($rekeningKoperasiId);

            if ((float) $rekeningKoperasi->saldo < $jumlah) {
                throw new RuntimeException('Saldo rekening koperasi tidak mencukupi untuk pencairan pinjaman.');
            }

            // Hitung angsuran per bulan flat
            $bungaTotal       = round($jumlah * ($bungaPersen / 100), 2);
            $bungaPerBulan    = round($bungaTotal / $tenorBulan, 2);
            $pokokPerBulan    = round($jumlah / $tenorBulan, 2);
            $angsuranPerBulan = round(($jumlah + $bungaTotal) / $tenorBulan, 2);

            $pinjaman = Pinjaman::query()->create([
                'anggota_id'      => $data['anggota_id'],
                'jumlah_pinjaman' => $jumlah,
                'bunga_persen'    => $bungaPersen,
                'tenor_bulan'     => $tenorBulan,
                'jumlah_angsuran' => $angsuranPerBulan,
                'tanggal_mulai'   => $tanggalMulai,
                'status'          => 'aktif',
            ]);

            // Potong saldo kas koperasi
            $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo - $jumlah, 2);
            $rekeningKoperasi->save();

            \App\Models\TransaksiKasKoperasi::query()->create([
                'rekening_koperasi_id' => $rekeningKoperasi->id,
                'jenis' => 'keluar',
                'jumlah' => $jumlah,
                'sumber_tipe' => 'pinjaman',
                'sumber_id' => $pinjaman->id,
                'user_id' => $data['user_id'] ?? '',
                'keterangan' => "Pencairan pinjaman",
                'created_at' => now(),
            ]);

            // Generate jadwal angsuran
            $this->generateJadwalAngsuran(
                pinjaman: $pinjaman,
                pokokPerBulan: $pokokPerBulan,
                bungaPerBulan: $bungaPerBulan,
                tanggalMulai: $tanggalMulai,
                tenorBulan: $tenorBulan,
            );

            return $pinjaman->refresh();
        });
    }

    /**
     * Proses pembayaran angsuran.
     */
    public function bayarAngsuran(Pinjaman $pinjaman, array $data): TransaksiPinjaman
    {
        return DB::transaction(function () use ($pinjaman, $data): TransaksiPinjaman {
            /** @var AngsuranPinjaman $angsuran */
            $angsuran = AngsuranPinjaman::query()
                ->lockForUpdate()
                ->where('pinjaman_id', $pinjaman->id)
                ->findOrFail($data['angsuran_id']);

            if ($angsuran->status === 'lunas') {
                throw new RuntimeException('Angsuran ini sudah lunas.');
            }

            $sekarang = Carbon::now();
            $jatuhTempo = Carbon::parse($angsuran->tanggal_jatuh_tempo);
            if ($sekarang->format('Y-m') < $jatuhTempo->format('Y-m')) {
                throw new RuntimeException('Pembayaran angsuran tidak dapat dilakukan sebelum bulan jatuh tempo.');
            }

            $jumlahBayar  = round((float) $data['jumlah_bayar'], 2);
            $dendaDibayar = round((float) ($data['denda_dibayar'] ?? 0), 2);
            $tanggalBayar = Carbon::parse((string) $data['tanggal_bayar']);

            $sisaTagihan = round((float) $angsuran->total_tagihan - (float) $angsuran->jumlah_dibayar, 2);

            if ($jumlahBayar > $sisaTagihan + $dendaDibayar) {
                throw new RuntimeException('Jumlah bayar melebihi sisa tagihan angsuran.');
            }

            // Catat transaksi pembayaran
            $transaksi = TransaksiPinjaman::query()->create([
                'pinjaman_id'   => $pinjaman->id,
                'angsuran_id'   => $angsuran->id,
                'jumlah_bayar'  => $jumlahBayar,
                'denda_dibayar' => $dendaDibayar,
                'tanggal_bayar' => $tanggalBayar,
                'created_at'    => now(),
            ]);

            // Update jumlah dibayar angsuran
            $angsuran->jumlah_dibayar = round((float) $angsuran->jumlah_dibayar + $jumlahBayar, 2);

            if ($angsuran->jumlah_dibayar >= (float) $angsuran->total_tagihan) {
                $angsuran->status = 'lunas';
            } elseif ($angsuran->jumlah_dibayar > 0) {
                $angsuran->status = 'sebagian';
            }

            $angsuran->save();

            // Cek apakah semua angsuran sudah lunas → update status pinjaman
            $this->updateStatusPinjamanJikaLunas($pinjaman);

            return $transaksi;
        });
    }

    /**
     * Hapus pinjaman (hanya jika belum ada angsuran yang dibayar).
     */
    public function delete(Pinjaman $pinjaman): void
    {
        DB::transaction(function () use ($pinjaman): void {
            $adaPembayaran = TransaksiPinjaman::query()
                ->where('pinjaman_id', $pinjaman->id)
                ->exists();

            if ($adaPembayaran) {
                throw new RuntimeException('Pinjaman tidak dapat dihapus karena sudah ada pembayaran angsuran.');
            }

            // Hapus angsuran dulu, lalu pinjaman
            $pinjaman->angsuran()->delete();
            $pinjaman->delete();
        });
    }

    /**
     * Pelunasan lebih awal.
     */
    public function pelunasan(Pinjaman $pinjaman, string $userId, Carbon $tanggalPelunasan): void
    {
        DB::transaction(function () use ($pinjaman, $userId, $tanggalPelunasan): void {
            $pinjaman->load(['angsuran' => fn($q) => $q->orderBy('angsuran_ke')]);

            // Hitung jumlah angsuran yang lunas
            $totalTenor = $pinjaman->tenor_bulan;
            $angsuranLunas = $pinjaman->angsuran->filter(
                fn (AngsuranPinjaman $a) => $a->status === 'lunas'
            )->count();

            if ($angsuranLunas < ($totalTenor * 0.5)) {
                throw new RuntimeException('Pelunasan awal hanya bisa dilakukan jika angsuran sudah berjalan minimal 50% dari tenor.');
            }

            if ($pinjaman->status === 'lunas') {
                throw new RuntimeException('Pinjaman ini sudah lunas.');
            }

            $angsuranSisa = $pinjaman->angsuran->filter(
                fn (AngsuranPinjaman $a) => $a->status !== 'lunas'
            )->values();

            if ($angsuranSisa->isEmpty()) {
                return; // already fully paid
            }

            $jumlahBebasBunga = (int) floor($totalTenor * 0.2); // Sesuai kesepakatan pembulatan ke bawah
            $totalSisaAngsuran = $angsuranSisa->count();
            
            $startIndexBebasBunga = $totalSisaAngsuran - $jumlahBebasBunga;
            if ($startIndexBebasBunga < 0) {
                $startIndexBebasBunga = 0;
            }

            foreach ($angsuranSisa as $index => $angsuran) {
                /** @var AngsuranPinjaman $angsuran */
                $isBebasBunga = $index >= $startIndexBebasBunga;

                $bungaAwal = (float) $angsuran->bunga;
                
                if ($isBebasBunga) {
                    $angsuran->bunga = 0;
                    $angsuran->total_tagihan = round((float) $angsuran->pokok, 2);
                }

                $sisaTagihan = round((float) $angsuran->total_tagihan - (float) $angsuran->jumlah_dibayar, 2);

                if ($sisaTagihan > 0) {
                    TransaksiPinjaman::query()->create([
                        'pinjaman_id'   => $pinjaman->id,
                        'angsuran_id'   => $angsuran->id,
                        'jumlah_bayar'  => $sisaTagihan,
                        'denda_dibayar' => 0, // Pelunasan massal tidak menerapkan denda tunggakan spesifik? Wait, if they are late they might have denda. For now assume no Denda.
                        'tanggal_bayar' => $tanggalPelunasan,
                        'created_at'    => now(),
                    ]);

                    $angsuran->jumlah_dibayar = round((float) $angsuran->jumlah_dibayar + $sisaTagihan, 2);
                }
                
                $angsuran->status = 'lunas';
                $angsuran->save();
            }

            $this->updateStatusPinjamanJikaLunas($pinjaman);
        });
    }

    // ─────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────

    private function generateJadwalAngsuran(
        Pinjaman $pinjaman,
        float $pokokPerBulan,
        float $bungaPerBulan,
        Carbon $tanggalMulai,
        int $tenorBulan,
    ): void {
        $angsuranData = [];

        for ($i = 1; $i <= $tenorBulan; $i++) {
            $jatuhTempo     = $tanggalMulai->copy()->addMonths($i);
            $totalTagihan   = round($pokokPerBulan + $bungaPerBulan, 2);

            $angsuranData[] = [
                'id'                => (string) \Illuminate\Support\Str::uuid(),
                'pinjaman_id'       => $pinjaman->id,
                'angsuran_ke'       => $i,
                'tanggal_jatuh_tempo' => $jatuhTempo->toDateString(),
                'pokok'             => $pokokPerBulan,
                'bunga'             => $bungaPerBulan,
                'denda'             => 0,
                'total_tagihan'     => $totalTagihan,
                'jumlah_dibayar'    => 0,
                'status'            => 'belum_bayar',
                'created_at'        => now(),
                'updated_at'        => now(),
            ];
        }

        AngsuranPinjaman::query()->insert($angsuranData);
    }

    private function updateStatusPinjamanJikaLunas(Pinjaman $pinjaman): void
    {
        $pinjaman->loadMissing('angsuran');

        $semuaLunas = $pinjaman->angsuran->every(
            fn (AngsuranPinjaman $a) => $a->status === 'lunas'
        );

        if ($semuaLunas) {
            $pinjaman->status = 'lunas';
            $pinjaman->save();
        }
    }
}
