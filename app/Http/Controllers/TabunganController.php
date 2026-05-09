<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tabungan\StoreTabunganRequest;
use App\Http\Requests\Tabungan\TarikTabunganRequest;
use App\Services\TabunganService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Database\QueryException;
use Inertia\Inertia;
use Inertia\Response;

class TabunganController extends Controller
{
    public function __construct(private readonly TabunganService $tabunganService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Tabungan/Index', $this->tabunganService->getIndexData());
    }

    /**
     * Get anggota dropdown data for form (lazy load)
     */
    public function getAnggotaOptions(): array
    {
        return [
            'anggota' => $this->tabunganService->getAnggotaForForm(),
        ];
    }

    /**
     * Get rekening koperasi dropdown data for form (lazy load)
     */
    public function getRekeningKoperasiOptions(): array
    {
        return [
            'rekening_koperasi' => $this->tabunganService->getRekeningKoperasiForForm(),
        ];
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTabunganRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['user_id'] = $request->user()?->id;

        try {
            $this->tabunganService->create($validated);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('tabungan.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('tabungan.index')
            ->with('success', 'Transaksi tabungan berhasil ditambahkan.');
    }

    /**
     * Tarik tabungan anggota
     */
    public function tarikTabungan(TarikTabunganRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['user_id'] = $request->user()?->id;

        try {
            $this->tabunganService->tarikTabungan($validated);
        } catch (QueryException|\RuntimeException $exception) {
            return redirect()
                ->route('tabungan.index')
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('tabungan.index')
            ->with('success', 'Tarik tabungan berhasil diproses.');
    }
}
