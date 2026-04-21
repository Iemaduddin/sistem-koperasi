<?php

namespace App\Http\Controllers;

use App\Models\Anggota;
use App\Models\AngsuranPinjaman;
use App\Models\Pinjaman;
use App\Models\RekeningSimpanan;
use App\Models\TransaksiSimpanan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $now = Carbon::now();

        // Total Anggota Counts
        $anggotaCounts = [
            'total' => Anggota::count(),
            'aktif' => Anggota::where('status', 'aktif')->count(),
            'nonaktif' => Anggota::where('status', 'nonaktif')->count(),
            'keluar' => Anggota::where('status', 'keluar')->count(),
        ];

        // Total Simpanan
        $totalSimpananAll = (float) RekeningSimpanan::sum('saldo');
        $totalSimpananBulanIni = (float) TransaksiSimpanan::where('jenis_transaksi', 'setor')
            ->whereYear('created_at', $now->year)
            ->whereMonth('created_at', $now->month)
            ->sum('jumlah');

        // Pinjaman Aktif (Total anggota yang pinjam)
        $pinjamanAktifCount = Pinjaman::where('status', 'aktif')
            ->distinct('anggota_id')
            ->count('anggota_id');

        // Tagihan Jatuh Tempo
        $tagihanJatuhTempoAll = AngsuranPinjaman::where('status', '!=', 'lunas')
            ->whereDate('tanggal_jatuh_tempo', '<=', $now->toDateString())
            ->count();
            
        $tagihanJatuhTempoBulanIni = AngsuranPinjaman::where('status', '!=', 'lunas')
            ->whereYear('tanggal_jatuh_tempo', $now->year)
            ->whereMonth('tanggal_jatuh_tempo', $now->month)
            ->count();

        // Saldo Keluar (Outstanding Receivables: Pokok + Bunga + Denda - Paid)
        $saldoKeluar = (float) AngsuranPinjaman::where('status', '!=', 'lunas')
            ->selectRaw('SUM(total_tagihan + denda - jumlah_dibayar) as total')
            ->value('total');

        return Inertia::render('Dashboard/Dashboard', [
            'stats' => [
                'anggota' => $anggotaCounts,
                'aset' => [ // Renamed from simpanan
                    'all' => $totalSimpananAll,
                    'bulan_ini' => $totalSimpananBulanIni,
                ],
                'pinjaman_aktif' => $pinjamanAktifCount,
                'tagihan_jatuh_tempo' => [
                    'all' => $tagihanJatuhTempoAll,
                    'bulan_ini' => $tagihanJatuhTempoBulanIni,
                ],
                'saldo_keluar' => $saldoKeluar,
            ],
        ]);
    }
}
