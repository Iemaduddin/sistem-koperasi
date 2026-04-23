<?php

namespace App\Http\Controllers;

use App\Http\Requests\RekapanAnggota\ImportRekapanAnggotaRequest;
use App\Models\Anggota;
use App\Services\RekapanAnggota\ImportRekapanAnggotaService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RekapanAnggotaController extends Controller
{
    public function __construct(private readonly ImportRekapanAnggotaService $importService)
    {
    }

    public function index(): Response
    {
        // Fetch all anggota with their savings and loans data
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

            foreach ($anggota->pinjaman as $pinjaman) {
                foreach ($pinjaman->transaksi as $transaksiPinjaman) {
                    if (! $transaksiPinjaman->tanggal_bayar) {
                        continue;
                    }

                    $key = Carbon::parse($transaksiPinjaman->tanggal_bayar)->format('Y-m');
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
                    $monthKeys[$key] = true;

                    if (! isset($monthlyMap[$key])) {
                        $monthlyMap[$key] = [
                            'month_key' => $key,
                            'angsuran' => 0,
                            'wajib' => 0,
                            'sukarela' => 0,
                        ];
                    }

                    $signedJumlah = (float) $transaksiSimpanan->jumlah;
                    if ($transaksiSimpanan->jenis_transaksi === 'tarik') {
                        $signedJumlah *= -1;
                    }

                    if ((int) $rekening->jenis_simpanan_id === 2) {
                        $monthlyMap[$key]['wajib'] += $signedJumlah;
                    }

                    if ((int) $rekening->jenis_simpanan_id === 3) {
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
                    'anggota' => (float) $anggota->rekeningSimpanan
                        ->where('jenis_simpanan_id', 1)
                        ->sum('saldo'),
                    'wajib' => (float) $anggota->rekeningSimpanan
                        ->where('jenis_simpanan_id', 2)
                        ->sum('saldo'),
                    'sukarela' => (float) $anggota->rekeningSimpanan
                        ->where('jenis_simpanan_id', 3)
                        ->sum('saldo'),
                ],
                'entries_bulanan' => array_values($monthlyMap),
            ];
        });

        ksort($monthKeys);
        $monthColumns = array_map(function (string $key) {
            $month = Carbon::createFromFormat('Y-m', $key);

            return [
                'key' => $key,
                'label' => $month->format('F Y'),
            ];
        }, array_keys($monthKeys));

        return Inertia::render('RekapanAnggota/Index', [
            'anggota_list' => $anggotaList,
            'anggota_detail_rows' => $anggotaDetailRows,
            'month_columns' => $monthColumns,
            'import_summary' => session('rekapan_anggota_import_summary'),
        ]);
    }

    public function import(ImportRekapanAnggotaRequest $request): RedirectResponse
    {
        try {
            $mode = (string) ($request->input('mode', 'persist'));
            $summary = $this->importService->parseWorkbook(
                file: $request->file('file'),
                userId: $request->user()?->id,
                persist: $mode !== 'dry-run',
            );
        } catch (\Throwable $exception) {
            return redirect()
                ->route('rekapan-anggota.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('rekapan-anggota.index')
            ->with('success', 'File berhasil diproses. Silakan review ringkasan hasil import.')
            ->with('rekapan_anggota_import_summary', $summary);
    }
}
