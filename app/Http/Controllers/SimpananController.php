<?php

namespace App\Http\Controllers;

use App\Exceptions\PerluKonfirmasiAlihSisaWajibException;
use App\Http\Requests\Simpanan\StoreSimpananRequest;
use App\Http\Requests\Simpanan\TarikSukarelaRequest;
use App\Http\Requests\Simpanan\UpdateSimpananRequest;
use App\Models\Simpanan;
use App\Services\SimpananService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SimpananController extends Controller
{
    public function __construct(private readonly SimpananService $simpananService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Simpanan/Index', $this->simpananService->getIndexData());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSimpananRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $this->simpananService->create($validated);
        } catch (PerluKonfirmasiAlihSisaWajibException $exception) {
            throw ValidationException::withMessages([
                'alihkan_sisa_wajib_ke_sukarela' => $exception->getMessage(),
            ]);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('simpanan.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('simpanan.index')
            ->with('success', 'Transaksi simpanan berhasil ditambahkan.');
    }

    public function tarikSukarela(TarikSukarelaRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $this->simpananService->tarikSukarela($validated);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('simpanan.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('simpanan.index')
            ->with('success', 'Tarik saldo simpanan sukarela berhasil diproses.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Simpanan $simpanan)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Simpanan $simpanan)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSimpananRequest $request, Simpanan $simpanan): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $this->simpananService->update($simpanan, $validated);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('simpanan.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('simpanan.index')
            ->with('success', 'Transaksi simpanan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Simpanan $simpanan): RedirectResponse
    {
        try {
            $this->simpananService->delete($simpanan);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('simpanan.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('simpanan.index')
            ->with('success', 'Transaksi simpanan berhasil dihapus.');
    }
}
