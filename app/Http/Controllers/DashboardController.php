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
        $cashPeriod = $request->query('cash_period', 'hari');
        $loanPeriod = $request->query('loan_period', 'hari');

        // New filters for stats
        $asetPeriod = $request->query('aset_period', 'semua');
        $saldoKeluarPeriod = $request->query('saldo_keluar_period', 'semua');
        $pinjamanAktifPeriod = $request->query('pinjaman_aktif_period', 'semua');
        $tagihanPeriod = $request->query('tagihan_period', 'semua');

        // Total Anggota Counts
        $anggotaCounts = [
            'total' => Anggota::count(),
            'aktif' => Anggota::where('status', 'aktif')->count(),
            'nonaktif' => Anggota::where('status', 'nonaktif')->count(),
            'keluar' => Anggota::where('status', 'keluar')->count(),
        ];

        // --- Metric: Aset ---
        // For 'semua', we show the current cumulative total.
        // For specific periods, we show total inflows (Kas Masuk) in that period.
        if ($asetPeriod === 'semua') {
            $totalSimpananAll = (float) RekeningSimpanan::sum('saldo');
            $totalRekeningKoperasiAll = (float) \App\Models\RekeningKoperasi::sum('saldo');
            $asetValue = $totalSimpananAll + $totalRekeningKoperasiAll;
        } else {
            $query = \App\Models\TransaksiKasKoperasi::where('jenis', 'masuk');
            $this->applyPeriodFilter($query, $asetPeriod);
            $asetValue = (float) $query->sum('jumlah');
        }

        // --- Metric: Saldo Keluar ---
        // For specific periods, we show receivables created in that timeframe.
        $saldoKeluarQuery = AngsuranPinjaman::where('status', '!=', 'lunas');
        $this->applyPeriodFilter($saldoKeluarQuery, $saldoKeluarPeriod);
        $saldoKeluarValue = (float) $saldoKeluarQuery->selectRaw('SUM(total_tagihan + denda - jumlah_dibayar) as total')->value('total');

        // --- Metric: Pinjaman Aktif ---
        $pinjamanAktifQuery = Pinjaman::where('status', 'aktif');
        $this->applyPeriodFilter($pinjamanAktifQuery, $pinjamanAktifPeriod);
        $pinjamanAktifValue = $pinjamanAktifQuery->distinct('anggota_id')->count('anggota_id');

        // --- Metric: Tagihan Jatuh Tempo ---
        $tagihanQuery = AngsuranPinjaman::where('status', '!=', 'lunas');
        if ($tagihanPeriod === 'semua') {
            $tagihanQuery->whereDate('tanggal_jatuh_tempo', '<=', $now->toDateString());
        } else {
            $this->applyPeriodFilter($tagihanQuery, $tagihanPeriod, 'tanggal_jatuh_tempo');
        }
        $tagihanValue = $tagihanQuery->count();

        // --- CHART: LOANS ---
        $chartLoans = $this->getChartData(
            Pinjaman::query(),
            $loanPeriod,
            'jumlah_pinjaman'
        );

        // --- CHART: CASH FLOW ---
        $cashMasukRaw = $this->getChartData(
            \App\Models\TransaksiKasKoperasi::where('jenis', 'masuk'),
            $cashPeriod,
            'jumlah'
        );
        $cashKeluarRaw = $this->getChartData(
            \App\Models\TransaksiKasKoperasi::where('jenis', 'keluar'),
            $cashPeriod,
            'jumlah'
        );

        $chartCashFlow = [
            [
                'id' => 'Masuk',
                'color' => 'hsl(142, 70%, 45%)',
                'data' => $cashMasukRaw,
            ],
            [
                'id' => 'Keluar',
                'color' => 'hsl(0, 70%, 50%)',
                'data' => $cashKeluarRaw,
            ],
        ];

        return Inertia::render('Dashboard/Dashboard', [
            'stats' => [
                'anggota' => $anggotaCounts,
                'aset' => [
                    'value' => $asetValue,
                    'period' => $asetPeriod,
                ],
                'pinjaman_aktif' => [
                    'value' => $pinjamanAktifValue,
                    'period' => $pinjamanAktifPeriod,
                ],
                'tagihan_jatuh_tempo' => [
                    'value' => $tagihanValue,
                    'period' => $tagihanPeriod,
                ],
                'saldo_keluar' => [
                    'value' => $saldoKeluarValue,
                    'period' => $saldoKeluarPeriod,
                ],
            ],
            'charts' => [
                'loans' => $chartLoans,
                'cashflow' => $chartCashFlow,
                'filters' => [
                    'cash_period' => $cashPeriod,
                    'loan_period' => $loanPeriod,
                ]
            ],
        ]);
    }

    private function applyPeriodFilter($query, $period, $dateColumn = 'created_at')
    {
        $now = Carbon::now();
        switch ($period) {
            case 'hari':
                $query->whereDate($dateColumn, $now->toDateString());
                break;
            case 'minggu':
                $query->whereBetween($dateColumn, [$now->copy()->startOfWeek()->toDateString(), $now->toDateString()]);
                break;
            case 'bulan':
                $query->whereYear($dateColumn, $now->year)->whereMonth($dateColumn, $now->month);
                break;
            case 'tahun':
                $query->whereYear($dateColumn, $now->year);
                break;
            // 'semua' remains without date filter
        }
    }


    private function getChartData($query, $period, $valueColumn, $dateColumn = 'created_at')
    {
        $now = Carbon::now();
        $data = collect();
        $labels = collect();

        switch ($period) {
            case 'hari':
                // Today by Hours (6 AM - 6 PM)
                $labels = collect(range(6, 18))->map(fn($h) => str_pad($h, 2, '0', STR_PAD_LEFT) . ':00');
                $results = $query->whereDate($dateColumn, $now->toDateString())
                    ->selectRaw("HOUR($dateColumn) as label, SUM($valueColumn) as total")
                    ->groupBy('label')
                    ->pluck('total', 'label');
                
                $data = $labels->map(fn($l, $i) => [
                    'x' => $l,
                    'y' => (float) ($results[$i + 6] ?? 0)
                ]);
                break;

            case 'minggu':
                // Current week by Days
                $startOfWeek = $now->copy()->startOfWeek();
                for ($i = 0; $i < 7; $i++) {
                    $date = $startOfWeek->copy()->addDays($i);
                    $labels->put($date->toDateString(), $date->format('D'));
                }
                
                $results = $query->whereBetween($dateColumn, [$startOfWeek->toDateString(), $now->toDateString()])
                    ->selectRaw("DATE($dateColumn) as label, SUM($valueColumn) as total")
                    ->groupBy('label')
                    ->pluck('total', 'label');

                $data = $labels->map(fn($l, $d) => [
                    'x' => $l,
                    'y' => (float) ($results[$d] ?? 0)
                ])->values();
                break;

            case 'bulan':
                // Current month by Days
                $daysInMonth = $now->daysInMonth;
                for ($i = 1; $i <= $daysInMonth; $i++) {
                    $labels->put($i, $i);
                }

                $results = $query->whereYear($dateColumn, $now->year)
                    ->whereMonth($dateColumn, $now->month)
                    ->selectRaw("DAY($dateColumn) as label, SUM($valueColumn) as total")
                    ->groupBy('label')
                    ->pluck('total', 'label');

                $data = $labels->map(fn($l, $d) => [
                    'x' => (string)$l,
                    'y' => (float) ($results[$d] ?? 0)
                ])->values();
                break;

            case 'semua':
                // All time by Years
                $results = $query->selectRaw("YEAR($dateColumn) as label, SUM($valueColumn) as total")
                    ->groupBy('label')
                    ->orderBy('label')
                    ->get();
                
                $data = $results->map(fn($r) => [
                    'x' => (string)$r->label,
                    'y' => (float)$r->total
                ]);
                break;

            case 'tahun':
            default:
                // Current year by Months
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                $results = $query->whereYear($dateColumn, $now->year)
                    ->selectRaw("MONTH($dateColumn) as label, SUM($valueColumn) as total")
                    ->groupBy('label')
                    ->pluck('total', 'label');

                $data = collect($months)->map(fn($m, $i) => [
                    'x' => $m,
                    'y' => (float) ($results[$i + 1] ?? 0)
                ]);
                break;
        }

        return $data;
    }

}
