<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\AngsuranPinjaman;
use App\Models\Pinjaman;
use App\Models\TransaksiPinjaman;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Denda keterlambatan: 0,1% per hari dari pokok angsuran.
 * Ubah nilai ini untuk mengubah tarif denda secara global.
 */
const DENDA_PERSEN_PER_HARI = 0.001;

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
     * Ambil data angsuran yang terlambat.
     *
     * @return array<string, mixed>
     */
    public function getOverdueData(): array
    {
        $overdueAngsuran = AngsuranPinjaman::with(['pinjaman.anggota'])
            ->where('status', '!=', 'lunas')
            ->whereDate('tanggal_jatuh_tempo', '<', now()->toDateString())
            ->orderBy('tanggal_jatuh_tempo', 'asc')
            ->get()
            ->map(function ($item) {
                $hariTerlambat = (int) now()->startOfDay()->diffInDays(Carbon::parse($item->tanggal_jatuh_tempo)->startOfDay(), false);
                $item->hari_terlambat = abs($hariTerlambat);
                $item->denda_estimasi = $this->hitungDenda($item->pinjaman, $item, now());
                return $item;
            });

        return [
            'overdue_angsuran' => $overdueAngsuran,
            'upcoming_angsuran' => AngsuranPinjaman::with(['pinjaman.anggota'])
                ->where('status', '!=', 'lunas')
                ->whereDate('tanggal_jatuh_tempo', '>=', now()->toDateString())
                ->whereDate('tanggal_jatuh_tempo', '<=', now()->endOfMonth()->toDateString())
                ->orderBy('tanggal_jatuh_tempo', 'asc')
                ->get()
                ->map(function ($item) {
                    $hariMenujuJatuhTempo = (int) now()->startOfDay()->diffInDays(Carbon::parse($item->tanggal_jatuh_tempo)->startOfDay(), false);
                    $item->hari_tersisa = max(0, $hariMenujuJatuhTempo);
                    return $item;
                }),
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

            $sekarang   = Carbon::now();
            $jatuhTempo = Carbon::parse($angsuran->tanggal_jatuh_tempo);

            if ($sekarang->format('Y-m') < $jatuhTempo->format('Y-m')) {
                throw new RuntimeException('Pembayaran angsuran tidak dapat dilakukan sebelum bulan jatuh tempo.');
            }

            // ── Hitung & simpan denda keterlambatan ke tabel angsuran ───────
            $dendaTagihan = $this->hitungDenda($pinjaman, $angsuran, $sekarang);
            if ($dendaTagihan !== (float) $angsuran->denda) {
                $angsuran->denda         = $dendaTagihan;
                $angsuran->total_tagihan = round((float) $angsuran->pokok + (float) $angsuran->bunga + $dendaTagihan, 2);
            }

            $jumlahBayar  = round((float) $data['jumlah_bayar'], 2);
            $dendaDibayar = round((float) ($data['denda_dibayar'] ?? 0), 2);
            $tanggalBayar = Carbon::parse((string) $data['tanggal_bayar']);

            $sisaPokok  = round((float) $angsuran->total_tagihan - (float) $angsuran->jumlah_dibayar, 2);
            $sisaDenda  = round((float) $angsuran->denda, 2);
            $totalHarusBayar = round($sisaPokok + $sisaDenda, 2);

            if ($jumlahBayar + $dendaDibayar > $totalHarusBayar + 0.01) {
                throw new RuntimeException('Jumlah bayar melebihi total tagihan angsuran (pokok + bunga + denda).');
            }

            // ── Catat transaksi pembayaran ───────────────────────────────────
            $transaksi = TransaksiPinjaman::query()->create([
                'pinjaman_id'   => $pinjaman->id,
                'angsuran_id'   => $angsuran->id,
                'jumlah_bayar'  => $jumlahBayar,
                'denda_dibayar' => $dendaDibayar,
                'tanggal_bayar' => $tanggalBayar,
                'created_at'    => now(),
            ]);

            // ── Update jumlah dibayar & status angsuran ──────────────────────
            // Sekarang jumlah_dibayar menyimpan total (pokok + bunga + denda)
            $angsuran->jumlah_dibayar = round((float) $angsuran->jumlah_dibayar + $jumlahBayar + $dendaDibayar, 2);

            // Lunas jika pokok + bunga sudah terpenuhi (denda opsional)
            // Kita perlu menghitung total pokok+bunga yang sudah dibayar. 
            // Karena jumlah_dibayar sekarang gabungan, kita cek dari transaksi atau 
            // asumsikan jumlahBayar yang diinput user adalah untuk pokok+bunga.
            
            // Berdasarkan input: $jumlahBayar adalah pokok+bunga, $dendaDibayar adalah denda.
            // Kita perlu tahu total pokok+bunga yang sudah dibayar selama ini.
            $totalPokokBungaDibayar = $angsuran->transaksi()->sum('jumlah_bayar');

            if ($totalPokokBungaDibayar >= (float) $angsuran->pokok + (float) $angsuran->bunga) {
                $angsuran->status = 'lunas';
            } else {
                $angsuran->status = 'belum_bayar';
            }

            $angsuran->save();

            // Tambahkan saldo rekening koperasi (kas masuk dari pembayaran angsuran)
            $totalMasuk = round($jumlahBayar + $dendaDibayar, 2);
            $rekeningKoperasi = \App\Models\TransaksiKasKoperasi::query()
                ->where('sumber_tipe', 'pinjaman')
                ->where('sumber_id', $pinjaman->id)
                ->where('jenis', 'keluar')
                ->first()
                ?->rekeningKoperasi()
                ->lockForUpdate()
                ->first();

            if ($rekeningKoperasi) {
                $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo + $totalMasuk, 2);
                $rekeningKoperasi->save();

                \App\Models\TransaksiKasKoperasi::query()->create([
                    'rekening_koperasi_id' => $rekeningKoperasi->id,
                    'jenis'                => 'masuk',
                    'jumlah'               => $totalMasuk,
                    'sumber_tipe'          => 'angsuran_pinjaman',
                    'sumber_id'            => $transaksi->id,
                    'user_id'              => $data['user_id'] ?? '',
                    'keterangan'           => "Pembayaran angsuran ke-{$angsuran->angsuran_ke} pinjaman",
                    'created_at'           => now(),
                ]);
            }

            // Cek apakah semua angsuran sudah lunas → update status pinjaman
            $this->updateStatusPinjamanJikaLunas($pinjaman);

            return $transaksi;
        });
    }

    /**
     * Hapus pinjaman (hanya jika belum ada angsuran yang dibayar).
     * Saldo rekening koperasi dikembalikan sebesar jumlah pencairan.
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

            // Ambil transaksi kas pencairan (jenis: keluar) untuk pinjaman ini
            $transaksiKas = \App\Models\TransaksiKasKoperasi::query()
                ->where('sumber_tipe', 'pinjaman')
                ->where('sumber_id', $pinjaman->id)
                ->where('jenis', 'keluar')
                ->first();

            // Kembalikan saldo rekening koperasi
            if ($transaksiKas) {
                $rekeningKoperasi = \App\Models\RekeningKoperasi::query()
                    ->lockForUpdate()
                    ->find($transaksiKas->rekening_koperasi_id);

                if ($rekeningKoperasi) {
                    $rekeningKoperasi->saldo = round(
                        (float) $rekeningKoperasi->saldo + (float) $pinjaman->jumlah_pinjaman,
                        2
                    );
                    $rekeningKoperasi->save();
                }

                // Hapus catatan transaksi kas pencairan
                $transaksiKas->delete();
            }

            // Hapus jadwal angsuran lalu pinjaman
            $pinjaman->angsuran()->delete();
            $pinjaman->delete();
        });
    }

    /**
     * Ambil ringkasan pelunasan awal (simulasi).
     */
    public function getPelunasanSummary(Pinjaman $pinjaman): array
    {
        $pinjaman->load(['angsuran' => fn($q) => $q->orderBy('angsuran_ke')]);

        $totalTenor = $pinjaman->tenor_bulan;
        $angsuranSisa = $pinjaman->angsuran->filter(
            fn (AngsuranPinjaman $a) => $a->status !== 'lunas'
        )->values();

        $jumlahBebasBunga = (int) floor($totalTenor * 0.2);
        $totalSisaAngsuran = $angsuranSisa->count();

        $startIndexBebasBunga = $totalSisaAngsuran - $jumlahBebasBunga;
        if ($startIndexBebasBunga < 0) {
            $startIndexBebasBunga = 0;
        }

        $totalPokok = 0.0;
        $totalBunga = 0.0;
        $totalDenda = 0.0;
        $potonganBunga = 0.0;
        $rincian = [];

        foreach ($angsuranSisa as $index => $angsuran) {
            /** @var AngsuranPinjaman $angsuran */
            $isBebasBunga = $index >= $startIndexBebasBunga;

            $pokok = (float) $angsuran->pokok;
            $bungaOriginal = (float) $angsuran->bunga;
            $denda = $this->hitungDenda($pinjaman, $angsuran, now());

            $bungaBayar = $isBebasBunga ? 0.0 : $bungaOriginal;
            if ($isBebasBunga) {
                $potonganBunga += $bungaOriginal;
            }

            $totalPokok += $pokok;
            $totalBunga += $bungaBayar;
            $totalDenda += $denda;

            $rincian[] = [
                'angsuran_ke' => $angsuran->angsuran_ke,
                'tanggal_jatuh_tempo' => $angsuran->tanggal_jatuh_tempo,
                'pokok' => $pokok,
                'bunga' => $bungaBayar, // Gunakan bungaBayar agar diskon (0) tampil
                'bunga_original' => $bungaOriginal,
                'denda' => $denda,
                'is_bebas_bunga' => $isBebasBunga,
                'subtotal' => round($pokok + $bungaBayar + $denda, 2),
            ];
        }

        return [
            'total_pokok' => round($totalPokok, 2),
            'total_bunga' => round($totalBunga, 2),
            'total_denda' => round($totalDenda, 2),
            'potongan_bunga' => round($potonganBunga, 2),
            'total_pembayaran' => round($totalPokok + $totalBunga + $totalDenda, 2),
            'rincian' => $rincian,
        ];
    }

    /**
     * Pelunasan lebih awal.
     */
    public function pelunasan(Pinjaman $pinjaman, string $userId, Carbon $tanggalPelunasan, ?float $customDenda = null): void
    {
        DB::transaction(function () use ($pinjaman, $userId, $tanggalPelunasan, $customDenda): void {
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

            // Ambil rekening koperasi dari transaksi pencairan pinjaman
            $rekeningKoperasi = \App\Models\TransaksiKasKoperasi::query()
                ->where('sumber_tipe', 'pinjaman')
                ->where('sumber_id', $pinjaman->id)
                ->where('jenis', 'keluar')
                ->first()
                ?->rekeningKoperasi()
                ->lockForUpdate()
                ->first();

            $jumlahBebasBunga = (int) floor($totalTenor * 0.2); // Sesuai kesepakatan pembulatan ke bawah
            $totalSisaAngsuran = $angsuranSisa->count();
            
            $startIndexBebasBunga = $totalSisaAngsuran - $jumlahBebasBunga;
            if ($startIndexBebasBunga < 0) {
                $startIndexBebasBunga = 0;
            }

            $summary = $this->getPelunasanSummary($pinjaman);
            
            // Override denda if custom denda is provided
            $totalDendaToCollect = $customDenda ?? $summary['total_denda'];
            $totalMasuk = $summary['total_pokok'] + $summary['total_bunga'] + $totalDendaToCollect;

            $dendaSisa = $totalDendaToCollect;
            $countSisa = $angsuranSisa->count();

            foreach ($angsuranSisa as $index => $angsuran) {
                /** @var AngsuranPinjaman $angsuran */
                $itemRincian = collect($summary['rincian'])->firstWhere('angsuran_ke', $angsuran->angsuran_ke);
                
                if (!$itemRincian) continue;

                $pokok = $itemRincian['pokok'];
                $bunga = $itemRincian['is_bebas_bunga'] ? 0 : $itemRincian['bunga'];
                
                // Distribute custom denda: put all on the first installment or split it?
                // Let's split it proportionally or just put it on the first one. 
                // For simplicity and since it's a one-time payoff, we'll assign denda only as much as needed.
                $dendaUntukIni = 0.0;
                if ($dendaSisa > 0) {
                    if ($index === $countSisa - 1) {
                        $dendaUntukIni = $dendaSisa;
                    } else {
                        // Split or just take from the top. Let's take from the top.
                        $dendaUntukIni = round($totalDendaToCollect / $countSisa, 2);
                        $dendaSisa = round($dendaSisa - $dendaUntukIni, 2);
                    }
                }

                $totalTagihanBaru = round($pokok + $bunga + $dendaUntukIni, 2);
                $sisaHarusBayar = round($totalTagihanBaru - (float) $angsuran->jumlah_dibayar, 2);

                if ($sisaHarusBayar > 0) {
                    $transaksi = TransaksiPinjaman::query()->create([
                        'pinjaman_id'   => $pinjaman->id,
                        'angsuran_id'   => $angsuran->id,
                        'jumlah_bayar'  => round($pokok + $bunga, 2),
                        'denda_dibayar' => $dendaUntukIni,
                        'tanggal_bayar' => $tanggalPelunasan,
                        'created_at'    => now(),
                    ]);

                    $angsuran->bunga = $bunga;
                    $angsuran->denda = $dendaUntukIni;
                    $angsuran->total_tagihan = $totalTagihanBaru;
                    $angsuran->jumlah_dibayar = round((float) $angsuran->jumlah_dibayar + $sisaHarusBayar, 2);
                }

                $angsuran->status = 'lunas';
                $angsuran->save();
            }

            // Tambahkan saldo rekening koperasi (kas masuk dari pelunasan)
            if ($rekeningKoperasi && $totalMasuk > 0) {
                $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo + $totalMasuk, 2);
                $rekeningKoperasi->save();

                \App\Models\TransaksiKasKoperasi::query()->create([
                    'rekening_koperasi_id' => $rekeningKoperasi->id,
                    'jenis'                => 'masuk',
                    'jumlah'               => $totalMasuk,
                    'sumber_tipe'          => 'pinjaman',
                    'sumber_id'            => $pinjaman->id,
                    'user_id'              => $userId,
                    'keterangan'           => 'Pelunasan awal pinjaman (Sisa Pokok + Bunga + Denda)',
                    'created_at'           => now(),
                ]);
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
        for ($i = 1; $i <= $tenorBulan; $i++) {
            $jatuhTempo     = $tanggalMulai->copy()->addMonths($i);
            $totalTagihan   = round($pokokPerBulan + $bungaPerBulan, 2);

            AngsuranPinjaman::query()->create([
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
            ]);
        }
    }

    private function updateStatusPinjamanJikaLunas(Pinjaman $pinjaman): void
    {
        // Pastikan kita mengecek status terbaru dari database
        $countBelumLunas = \App\Models\AngsuranPinjaman::query()
            ->where('pinjaman_id', $pinjaman->id)
            ->where('status', '!=', 'lunas')
            ->count();

        if ($countBelumLunas === 0) {
            $pinjaman->status = 'lunas';
            $pinjaman->save();
        }
    }

    /**
     * Hitung denda keterlambatan: 0,1% per hari dari JUMLAH POKOK PINJAMAN.
     * Denda hanya dikenakan jika sudah melewati tanggal jatuh tempo.
     * Jika belum terlambat, kembalikan 0.
     */
    private function hitungDenda(Pinjaman $pinjaman, AngsuranPinjaman $angsuran, \Carbon\CarbonInterface $sekarang): float
    {
        $jatuhTempo = Carbon::parse($angsuran->tanggal_jatuh_tempo)->startOfDay();
        $today      = $sekarang->copy()->startOfDay();

        if ($today->lte($jatuhTempo)) {
            return 0.0;
        }

        $hariTerlambat = (int) $jatuhTempo->diffInDays($today);
        $denda = round((float) $pinjaman->jumlah_pinjaman * DENDA_PERSEN_PER_HARI * $hariTerlambat, 2);

        return $denda;
    }
}
