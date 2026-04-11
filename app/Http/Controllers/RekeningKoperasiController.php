<?php

namespace App\Http\Controllers;

use App\Models\RekeningKoperasi;
use App\Http\Requests\RekeningKoperasi\StoreRekeningKoperasiRequest;
use App\Http\Requests\RekeningKoperasi\UpdateRekeningKoperasiRequest;
use App\Services\RekeningKoperasiService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RekeningKoperasiController extends Controller
{
    public function __construct(private readonly RekeningKoperasiService $rekeningKoperasiService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('RekeningKoperasi/Index', [
            'rekening_koperasi' => $this->rekeningKoperasiService->getIndexData(),
        ]);
    }

    public function store(StoreRekeningKoperasiRequest $request): RedirectResponse
    {
        $this->rekeningKoperasiService->create($request->validated());

        return redirect()
            ->route('rekening-koperasi.index')
            ->with('success', 'Rekening koperasi berhasil ditambahkan.');
    }

    public function update(
        UpdateRekeningKoperasiRequest $request,
        RekeningKoperasi $rekening_koperasi,
    ): RedirectResponse
    {
        $this->rekeningKoperasiService->update($rekening_koperasi, $request->validated());

        return redirect()
            ->route('rekening-koperasi.index')
            ->with('success', 'Rekening koperasi berhasil diperbarui.');
    }
}
