<?php

namespace App\Http\Controllers;

use App\Exports\RekapanAnggota\RekapanAnggotaExport;
use App\Http\Requests\RekapanAnggota\ImportRekapanAnggotaRequest;
use App\Models\Anggota;
use App\Services\RekapanAnggota\ImportRekapanAnggotaService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class RekapanAnggotaController extends Controller
{
    public function __construct(private readonly ImportRekapanAnggotaService $importService)
    {
    }

    public function index(): Response
    {
        $data = $this->buildRekapanData();

        return Inertia::render('RekapanAnggota/Index', [
            'anggota_list' => $data['anggota_list'],
            'anggota_detail_rows' => $data['anggota_detail_rows'],
            'month_columns' => $data['month_columns'],
            'rekening_koperasi' => \App\Models\RekeningKoperasi::orderBy('nama')->get(['id', 'nama', 'jenis', 'nomor_rekening', 'saldo']),
            'import_summary' => session('rekapan_anggota_import_summary'),
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $data = $this->buildRekapanData();

        $filterMode = (string) $request->query('filter_mode', 'month-year');
        $selectedMonthYear = $request->query('month_year');
        $selectedYear = $request->query('year');
        $exportType = (string) $request->query('export_type', 'all');

        $isFiltered = $exportType === 'filtered';
        $safeSelectedMonthYear = is_string($selectedMonthYear) ? $selectedMonthYear : null;
        $safeSelectedYear = is_string($selectedYear) ? $selectedYear : null;

        $documentTitle = $this->buildExportDocumentTitle(
            isFiltered: $isFiltered,
            filterMode: $filterMode,
            selectedMonthYear: $safeSelectedMonthYear,
            selectedYear: $safeSelectedYear,
        );

        $filename = $this->buildExportFilename(
            isFiltered: $isFiltered,
            filterMode: $filterMode,
            selectedMonthYear: $safeSelectedMonthYear,
            selectedYear: $safeSelectedYear,
        );

        return Excel::download(
            new RekapanAnggotaExport(
                anggotaDetailRows: $data['anggota_detail_rows'],
                anggotaList: $data['anggota_list'],
                monthColumns: $data['month_columns'],
                isFiltered: $isFiltered,
                filterMode: $filterMode,
                selectedMonthYear: $safeSelectedMonthYear,
                selectedYear: $safeSelectedYear,
                documentTitle: $documentTitle,
            ),
            $filename,
        );
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function buildRekapanData(): array
    {
        $monthKeys = [];

        $anggotaRecords = Anggota::query()
            ->select(
                'anggota.id',
                'anggota.no_anggota',
                'anggota.nama',
                'anggota.tanggal_bergabung'
            )
            ->with([
                'rekeningSimpanan' => function ($query) {
                    $query->select('id', 'anggota_id', 'jenis_simpanan_id', 'saldo')
                        ->with([
                            'transaksi' => function ($transaksiQuery) {
                                $transaksiQuery->select(
                                    'id',
                                    'rekening_simpanan_id',
                                    'batch_id',
                                    'jenis_transaksi',
                                    'jumlah',
                                    'created_at'
                                )->with([
                                    'batch:id,tanggal_transaksi',
                                ]);
                            },
                        ]);
                },
                'pinjaman' => function ($query) {
                    $query->select(
                        'id',
                        'anggota_id',
                        'jumlah_pinjaman',
                        'jumlah_angsuran',
                        'tenor_bulan',
                        'status'
                    )->with([
                        'angsuran:id,pinjaman_id,jumlah_dibayar',
                        'transaksi:id,pinjaman_id,jumlah_bayar,tanggal_bayar',
                    ]);
                },
            ])
            ->orderBy('anggota.no_anggota')
            ->get();

        $anggotaList = $anggotaRecords->map(function ($anggota) {
                // Get savings by type from rekening_simpanan
                $simpananPokok = $anggota->rekeningSimpanan
                    ->where('jenis_simpanan_id', 1)
                    ->sum('saldo');
                $simpananWajib = $anggota->rekeningSimpanan
                    ->where('jenis_simpanan_id', 2)
                    ->sum('saldo');
                $simpananSukarela = $anggota->rekeningSimpanan
                    ->where('jenis_simpanan_id', 3)
                    ->sum('saldo');

                // Get loan data
                $pinjamanTotal = $anggota->pinjaman->sum('jumlah_pinjaman');
                $totalAngsuran = $anggota->pinjaman
                    ->flatMap(fn ($pinjaman) => $pinjaman->angsuran)
                    ->sum('jumlah_dibayar');

                $hasActiveLoan = $anggota->pinjaman
                    ->contains(fn ($pinjaman) => $pinjaman->status === 'aktif');

                return [
                    'id' => $anggota->id,
                    'no_anggota' => $anggota->no_anggota,
                    'nama' => $anggota->nama,
                    'tanggal_masuk' => $anggota->tanggal_bergabung?->format('d-m-Y'),
                    'simpanan_pokok' => (int) $simpananPokok,
                    'simpanan_wajib' => (int) $simpananWajib,
                    'simpanan_sukarela' => (int) $simpananSukarela,
                    'pinjaman_pokok' => (int) ($anggota->pinjaman->first()?->jumlah_pinjaman ?? 0),
                    'pinjaman_total' => (int) $pinjamanTotal,
                    'angsuran_terbayar' => (int) $totalAngsuran,
                    'sisa_pinjaman' => max(0, (int) $pinjamanTotal - (int) $totalAngsuran),
                    'status' => $hasActiveLoan ? 'AKTIF' : 'LUNAS',
                ];
            });

        $anggotaDetailRows = $anggotaRecords->map(function ($anggota) use (&$monthKeys) {
            $pinjamanPertama = $anggota->pinjaman->first();
            $monthlyMap = [];
            $tanggalMasukKey = $anggota->tanggal_bergabung?->toDateString();
            $tanggalMasukMonthKey = $anggota->tanggal_bergabung?->format('Y-m');
            $simpananAwalByJenis = [
                1 => 0.0,
                2 => 0.0,
                3 => 0.0,
            ];

            foreach ($anggota->pinjaman as $pinjaman) {
                foreach ($pinjaman->transaksi as $transaksiPinjaman) {
                    if (! $transaksiPinjaman->tanggal_bayar) {
                        continue;
                    }

                    $key = Carbon::parse($transaksiPinjaman->tanggal_bayar)->format('Y-m');

                    if ($tanggalMasukMonthKey !== null && $key === $tanggalMasukMonthKey) {
                        continue;
                    }

                    $monthKeys[$key] = true;

                    if (! isset($monthlyMap[$key])) {
                        $monthlyMap[$key] = [
                            'month_key' => $key,
                            'angsuran' => 0,
                            'wajib' => 0,
                            'sukarela' => 0,
                        ];
                    }

                    $monthlyMap[$key]['angsuran'] += (float) $transaksiPinjaman->jumlah_bayar;
                }
            }

            foreach ($anggota->rekeningSimpanan as $rekening) {
                foreach ($rekening->transaksi as $transaksiSimpanan) {
                    $tanggalTransaksi = $transaksiSimpanan->batch?->tanggal_transaksi
                        ?? $transaksiSimpanan->created_at;

                    if (! $tanggalTransaksi) {
                        continue;
                    }

                    $key = Carbon::parse($tanggalTransaksi)->format('Y-m');
                    $tanggalTransaksiDate = Carbon::parse($tanggalTransaksi)->toDateString();

                    $signedJumlah = (float) $transaksiSimpanan->jumlah;
                    if ($transaksiSimpanan->jenis_transaksi === 'tarik') {
                        $signedJumlah *= -1;
                    }

                    $jenisId = (int) $rekening->jenis_simpanan_id;
                    if (
                        $tanggalMasukKey !== null
                        && $tanggalTransaksiDate === $tanggalMasukKey
                        && array_key_exists($jenisId, $simpananAwalByJenis)
                    ) {
                        $simpananAwalByJenis[$jenisId] += $signedJumlah;
                    }

                    if ($tanggalMasukMonthKey !== null && $key === $tanggalMasukMonthKey) {
                        continue;
                    }

                    $monthKeys[$key] = true;

                    if (! isset($monthlyMap[$key])) {
                        $monthlyMap[$key] = [
                            'month_key' => $key,
                            'angsuran' => 0,
                            'wajib' => 0,
                            'sukarela' => 0,
                        ];
                    }

                    if ($jenisId === 2) {
                        $monthlyMap[$key]['wajib'] += $signedJumlah;
                    }

                    if ($jenisId === 3) {
                        $monthlyMap[$key]['sukarela'] += $signedJumlah;
                    }
                }
            }

            ksort($monthlyMap);

            return [
                'id' => $anggota->id,
                'no_anggota' => $anggota->no_anggota,
                'nama' => $anggota->nama,
                'tanggal_masuk' => $anggota->tanggal_bergabung?->format('d-m-Y'),
                'pinjaman' => (float) ($pinjamanPertama?->jumlah_pinjaman ?? 0),
                'angsuran' => (float) ($pinjamanPertama?->jumlah_angsuran ?? 0),
                'tenor' => (int) ($pinjamanPertama?->tenor_bulan ?? 0),
                'simpanan_awal' => [
                    'anggota' => (float) $simpananAwalByJenis[1],
                    'wajib' => (float) $simpananAwalByJenis[2],
                    'sukarela' => (float) $simpananAwalByJenis[3],
                ],
                'entries_bulanan' => array_values($monthlyMap),
            ];
        });

        ksort($monthKeys);
        $monthColumns = array_map(function (string $key) {
            $month = Carbon::createFromFormat('Y-m', $key);

            return [
                'key' => $key,
                'label' => $month->locale('id')->translatedFormat('F Y'),
            ];
        }, array_keys($monthKeys));

        return [
            'anggota_list' => $anggotaList->values()->all(),
            'anggota_detail_rows' => $anggotaDetailRows->values()->all(),
            'month_columns' => array_values($monthColumns),
        ];
    }

    private function buildExportFilename(
        bool $isFiltered,
        string $filterMode,
        ?string $selectedMonthYear,
        ?string $selectedYear,
    ): string {
        $timestamp = now()->format('Ymd_His');

        if (! $isFiltered) {
            return "Laporan_Rekapan_Anggota_Keseluruhan_{$timestamp}.xlsx";
        }

        if ($filterMode === 'year' && $selectedYear !== null && $selectedYear !== '') {
            return "Laporan_Rekapan_Anggota_Tahun_{$selectedYear}_{$timestamp}.xlsx";
        }

        if ($filterMode === 'month-year' && $selectedMonthYear !== null && preg_match('/^\d{4}-\d{2}$/', $selectedMonthYear) === 1) {
            [$year, $month] = explode('-', $selectedMonthYear);
            return "Laporan_Rekapan_Anggota_Bulan_{$year}_{$month}_{$timestamp}.xlsx";
        }

        return "Laporan_Rekapan_Anggota_Filter_{$timestamp}.xlsx";
    }

    private function buildExportDocumentTitle(
        bool $isFiltered,
        string $filterMode,
        ?string $selectedMonthYear,
        ?string $selectedYear,
    ): string {
        if (! $isFiltered) {
            return 'Laporan Rekapan Anggota - Keseluruhan';
        }

        if ($filterMode === 'year' && $selectedYear !== null && $selectedYear !== '') {
            return "Laporan Rekapan Anggota - Tahun {$selectedYear}";
        }

        if ($filterMode === 'month-year' && $selectedMonthYear !== null && preg_match('/^\d{4}-\d{2}$/', $selectedMonthYear) === 1) {
            try {
                $monthLabel = Carbon::createFromFormat('Y-m', $selectedMonthYear)
                    ->locale('id')
                    ->translatedFormat('F Y');

                return "Laporan Rekapan Anggota - {$monthLabel}";
            } catch (\Throwable) {
                return "Laporan Rekapan Anggota - {$selectedMonthYear}";
            }
        }

        return 'Laporan Rekapan Anggota - Data Filter';
    }

    public function import(ImportRekapanAnggotaRequest $request): RedirectResponse
    {
        try {
            $summary = $this->importService->parseWorkbook(
                file: $request->file('file'),
                userId: $request->user()?->id,
                persist: true,
                rekeningKoperasiId: (string) $request->input('rekening_koperasi_id'),
            );
        } catch (\Throwable $exception) {
            return redirect()
                ->route('rekapan-anggota.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('rekapan-anggota.index')
            ->with('success', 'File berhasil diproses dan disimpan ke database.')
            ->with('rekapan_anggota_import_summary', $summary);
    }
}
