<?php

namespace App\Http\Controllers;

use App\Http\Requests\Deposito\StoreSimpananDepositoRequest;
use App\Http\Requests\Deposito\TarikBagiHasilKumulatifRequest;
use App\Models\LogBagiHasilDeposito;
use App\Models\SimpananDeposito;
use App\Services\SimpananDepositoService;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimpananDepositoController extends Controller
{
    public function __construct(private readonly SimpananDepositoService $simpananDepositoService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Deposito/Index', $this->simpananDepositoService->getIndexData());
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
    public function store(StoreSimpananDepositoRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['created_at'] = $validated['created_at'] ?? now();
        $validated['user_id'] = $request->user()?->id;

        try {
            $this->simpananDepositoService->create($validated);
        } catch (QueryException | \RuntimeException $exception) {
            return redirect()
                ->route('deposito.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('deposito.index')
            ->with('success', 'Simpanan deposito berhasil ditambahkan.');
    }

    public function tarikBagiHasil(LogBagiHasilDeposito $logBagiHasilDeposito, Request $request): RedirectResponse
    {
        $userId = $request->user()?->id;

        try {
            $this->simpananDepositoService->tarikBagiHasil(
                (int) $logBagiHasilDeposito->id,
                $userId,
            );
        } catch (QueryException | \RuntimeException $exception) {
            return redirect()
                ->route('deposito.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('deposito.index')
            ->with('success', 'Penarikan bagi hasil berhasil diproses.');
    }

    public function tarikBagiHasilKumulatif(
        TarikBagiHasilKumulatifRequest $request,
        SimpananDeposito $simpananDeposito,
    ): RedirectResponse {
        $userId = $request->user()?->id;

        try {
            $updatedCount = $this->simpananDepositoService->tarikBagiHasilKumulatif(
                (string) $simpananDeposito->id,
                $request->validated('log_ids', []),
                $userId,
            );
        } catch (QueryException | \RuntimeException $exception) {
            return redirect()
                ->route('deposito.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('deposito.index')
            ->with('success', "Penarikan kumulatif berhasil diproses untuk {$updatedCount} log bagi hasil.");
    }

    /**
     * Display the specified resource.
     */
    public function show(SimpananDeposito $simpananDeposito)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SimpananDeposito $simpananDeposito)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SimpananDeposito $simpananDeposito)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SimpananDeposito $simpananDeposito)
    {
        //
    }

    /**
     * Halaman deposito bagi hasil.
     */
    public function bagiHasil(): Response
    {
        return Inertia::render('Deposito/BagiHasil', $this->simpananDepositoService->getBagiHasilData());
    }
}
