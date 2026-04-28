<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pinjaman\BayarAngsuranRequest;
use App\Http\Requests\Pinjaman\StorePinjamanRequest;
use App\Models\Pinjaman;
use App\Services\PinjamanService;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PinjamanController extends Controller
{
    public function __construct(private readonly PinjamanService $pinjamanService)
    {
    }

    /**
     * Daftar semua pinjaman.
     */
    public function index(): Response
    {
        return Inertia::render('Pinjaman/Index', $this->pinjamanService->getIndexData());
    }

    /**
     * Daftar angsuran yang terlambat.
     */
    public function terlambat(): Response
    {
        return Inertia::render('Pinjaman/Terlambat', $this->pinjamanService->getOverdueData());
    }

    /**
     * Simpan pinjaman baru.
     */
    public function store(StorePinjamanRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $validated['user_id'] = $request->user()?->id;
            $this->pinjamanService->create($validated);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('pinjaman.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('pinjaman.index')
            ->with('success', 'Pinjaman berhasil ditambahkan dan jadwal angsuran telah dibuat.');
    }

    /**
     * Detail pinjaman + jadwal angsuran.
     */
    public function show(Pinjaman $pinjaman): Response
    {
        return Inertia::render('Pinjaman/Show', $this->pinjamanService->getDetailData($pinjaman));
    }

    /**
     * Bayar angsuran.
     */
    public function bayarAngsuran(BayarAngsuranRequest $request, Pinjaman $pinjaman): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $validated['user_id'] = $request->user()?->id ?? '';
            $this->pinjamanService->bayarAngsuran($pinjaman, $validated);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('pinjaman.show', $pinjaman)
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('pinjaman.show', $pinjaman)
            ->with('success', 'Pembayaran angsuran berhasil dicatat.');
    }

    /**
     * Simulasi pelunasan pinjaman awal.
     */
    public function simulasiPelunasan(Pinjaman $pinjaman): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->pinjamanService->getPelunasanSummary($pinjaman));
    }

    /**
     * Pelunasan Pinjaman Lebih Awal
     */
    public function pelunasan(\Illuminate\Http\Request $request, Pinjaman $pinjaman): RedirectResponse
    {
        try {
            $tanggalPelunasan = Carbon::parse($request->input('tanggal_pelunasan', now()));
            $userId = $request->user()?->id ?? '';
            $customDenda = $request->has('denda_pelunasan') ? (float) $request->input('denda_pelunasan') : null;
            
            $this->pinjamanService->pelunasan($pinjaman, $userId, $tanggalPelunasan, $customDenda);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('pinjaman.show', $pinjaman)
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('pinjaman.show', $pinjaman)
            ->with('success', 'Pelunasan pinjaman awal berhasil!');
    }

    /**
     * Hapus pinjaman (hanya jika belum ada pembayaran).
     */
    public function destroy(Pinjaman $pinjaman): RedirectResponse
    {
        try {
            $this->pinjamanService->delete($pinjaman);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('pinjaman.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('pinjaman.index')
            ->with('success', 'Pinjaman berhasil dihapus.');
    }
}
