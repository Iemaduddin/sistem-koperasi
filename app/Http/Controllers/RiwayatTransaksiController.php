<?php

namespace App\Http\Controllers;

use App\Http\Requests\RiwayatTransaksi\ImportRiwayatTransaksiRequest;
use App\Services\RiwayatTransaksiImportService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatTransaksiController extends Controller
{
    public function __construct(private readonly RiwayatTransaksiImportService $importService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('RiwayatTransaksi/Index', [
            'import_summary' => session('riwayat_transaksi_import_summary'),
        ]);
    }

    public function import(ImportRiwayatTransaksiRequest $request): RedirectResponse
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
                ->route('riwayat-transaksi.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('riwayat-transaksi.index')
            ->with('success', 'File berhasil diproses. Silakan review ringkasan hasil import.')
            ->with('riwayat_transaksi_import_summary', $summary);
    }
}
