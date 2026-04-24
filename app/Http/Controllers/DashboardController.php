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
        
        $groupBy = $request->query('group_by', 'day');
        
        // Default range: Start of month to now, unless 'all' is selected
        if ($groupBy === 'all') {
            $startDate = null;
            $endDate = null;
        } else {
            $startDate = $request->query('start_date', $now->copy()->startOfMonth()->toDateString());
            $endDate = $request->query('end_date', $now->toDateString());
        }

        // Total Anggota Counts
        $anggotaCounts = [
            'total' => Anggota::count(),
            'aktif' => Anggota::where('status', 'aktif')->count(),
            'nonaktif' => Anggota::where('status', 'nonaktif')->count(),
            'keluar' => Anggota::where('status', 'keluar')->count(),
        ];

        // --- Metric: Aset ---
        $totalSimpananAll = (float) RekeningSimpanan::sum('saldo');
        $totalRekeningKoperasiAll = (float) \App\Models\RekeningKoperasi::sum('saldo');
        $asetTotal = $totalSimpananAll + $totalRekeningKoperasiAll;

        $asetQuery = \App\Models\TransaksiKasKoperasi::where('jenis', 'masuk');
        $this->applyDateFilter($asetQuery, $startDate, $endDate);
        $asetPeriodValue = (float) $asetQuery->sum('jumlah');

        // --- Metric: Saldo Keluar ---
        $saldoKeluarQuery = AngsuranPinjaman::where('status', '!=', 'lunas');
        $this->applyDateFilter($saldoKeluarQuery, $startDate, $endDate, 'tanggal_jatuh_tempo');
        $saldoKeluarValue = (float) $saldoKeluarQuery->selectRaw('SUM(total_tagihan + denda - jumlah_dibayar) as total')->value('total');

        // --- Metric: Pinjaman Aktif ---
        $pinjamanAktifQuery = Pinjaman::where('status', 'aktif');
        $this->applyDateFilter($pinjamanAktifQuery, $startDate, $endDate, 'tanggal_mulai');
        $pinjamanAktifValue = $pinjamanAktifQuery->distinct('anggota_id')->count('anggota_id');

        // --- Metric: Tagihan Jatuh Tempo ---
        $tagihanQuery = AngsuranPinjaman::where('status', '!=', 'lunas');
        $this->applyDateFilter($tagihanQuery, $startDate, $endDate, 'tanggal_jatuh_tempo');
        $tagihanValue = $tagihanQuery->count();

        // --- CHART: LOANS ---
        $chartLoans = $this->getChartData(
            Pinjaman::query(),
            'jumlah_pinjaman',
            $startDate,
            $endDate,
            $groupBy === 'all' ? 'year' : $groupBy,
            'tanggal_mulai'
        );

        // --- CHART: CASH FLOW ---
        $cashMasukRaw = $this->getChartData(
            \App\Models\TransaksiKasKoperasi::where('jenis', 'masuk'),
            'jumlah',
            $startDate,
            $endDate,
            $groupBy === 'all' ? 'year' : $groupBy
        );
        $cashKeluarRaw = $this->getChartData(
            \App\Models\TransaksiKasKoperasi::where('jenis', 'keluar'),
            'jumlah',
            $startDate,
            $endDate,
            $groupBy === 'all' ? 'year' : $groupBy
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
                    'total' => $asetTotal,
                    'period_value' => $asetPeriodValue,
                ],
                'pinjaman_aktif' => [
                    'value' => $pinjamanAktifValue,
                ],
                'tagihan_jatuh_tempo' => [
                    'value' => $tagihanValue,
                ],
                'saldo_keluar' => [
                    'value' => $saldoKeluarValue,
                ],
            ],
            'charts' => [
                'loans' => $chartLoans,
                'cashflow' => $chartCashFlow,
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'group_by' => $groupBy,
                ]
            ],
        ]);
    }

    private function applyDateFilter($query, $startDate, $endDate, $dateColumn = 'created_at')
    {
        if ($startDate) {
            $query->whereDate($dateColumn, '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate($dateColumn, '<=', $endDate);
        }
    }

    private function getChartData($query, $valueColumn, $startDate, $endDate, $groupBy = 'day', $dateColumn = 'created_at')
    {
        $this->applyDateFilter($query, $startDate, $endDate, $dateColumn);

        switch ($groupBy) {
            case 'year':
                $selectRaw = "YEAR($dateColumn) as label, SUM($valueColumn) as total";
                $orderBy = "label";
                break;
            case 'month':
                $selectRaw = "DATE_FORMAT($dateColumn, '%Y-%m') as label, SUM($valueColumn) as total";
                $orderBy = "label";
                break;
            case 'week':
                $selectRaw = "YEARWEEK($dateColumn, 1) as label, SUM($valueColumn) as total";
                $orderBy = "label";
                break;
            case 'day':
            default:
                $selectRaw = "DATE($dateColumn) as label, SUM($valueColumn) as total";
                $orderBy = "label";
                break;
        }

        $results = $query->selectRaw($selectRaw)
            ->groupBy('label')
            ->orderBy($orderBy)
            ->get();

        return $results->map(function ($r) use ($groupBy) {
            $label = $r->label;
            
            // Format labels for better display
            if ($groupBy === 'week') {
                $year = substr($label, 0, 4);
                $week = substr($label, 4);
                $label = "W$week $year";
            } elseif ($groupBy === 'month') {
                $label = Carbon::parse($label . '-01')->format('M Y');
            }

            return [
                'x' => (string)$label,
                'y' => (float)$r->total
            ];
        });
    }

}
