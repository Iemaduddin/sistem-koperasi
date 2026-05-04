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

        // --- Metric: Aset Mengendap ---
        $totalPokokBungaAngsuranBelumLunas = (float) AngsuranPinjaman::where('status', '!=', 'lunas')
            ->sum(\Illuminate\Support\Facades\DB::raw('pokok + bunga'));
            
        $totalDibayarPadaAngsuranBelumLunas = (float) \App\Models\TransaksiPinjaman::whereHas('angsuran', function($q) {
            $q->where('status', '!=', 'lunas');
        })->sum('jumlah_bayar');
        
        $asetMengendapValue = $totalPokokBungaAngsuranBelumLunas - $totalDibayarPadaAngsuranBelumLunas;

        // --- Metric: Kas Masuk & Keluar (Arus Kas) ---
        $kasMasukQuery = \App\Models\TransaksiKasKoperasi::where('jenis', 'masuk');
        $this->applyDateFilter($kasMasukQuery, $startDate, $endDate);
        $kasMasukValue = (float) $kasMasukQuery->sum('jumlah');

        $kasKeluarQuery = \App\Models\TransaksiKasKoperasi::where('jenis', 'keluar');
        $this->applyDateFilter($kasKeluarQuery, $startDate, $endDate);
        $kasKeluarValue = (float) $kasKeluarQuery->sum('jumlah');

        // --- Metric: Pinjaman Aktif ---
        $pinjamanAktifQuery = Pinjaman::where('status', 'aktif');
        $this->applyDateFilter($pinjamanAktifQuery, $startDate, $endDate, 'tanggal_mulai');
        $pinjamanAktifValue = $pinjamanAktifQuery->distinct('anggota_id')->count('anggota_id');

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

        // --- RECENT TRANSACTIONS ---
        $recentTransactions = \App\Models\TransaksiKasKoperasi::with([
            'sumber' => function ($morphTo) {
                $morphTo->morphWith([
                    \App\Models\Simpanan::class => ['rekeningSimpanan.anggota', 'rekeningSimpanan.jenisSimpanan'],
                    \App\Models\Pinjaman::class => ['anggota'],
                    \App\Models\TransaksiPinjaman::class => ['angsuran.pinjaman.anggota'],
                    \App\Models\SimpananDeposito::class => ['anggota'],
                ]);
            },
        ])->latest()->limit(5)->get();

        return Inertia::render('Dashboard/Dashboard', [
            'stats' => [
                'anggota' => $anggotaCounts,
                'arus_kas' => [
                    'masuk' => $kasMasukValue,
                    'keluar' => $kasKeluarValue,
                    'aset_mengendap' => max(0, $asetMengendapValue),
                ],
                'aset' => [
                    'total' => $asetTotal,
                ],
                'pinjaman_aktif' => [
                    'value' => $pinjamanAktifValue,
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
            'recent_transactions' => $recentTransactions,
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
