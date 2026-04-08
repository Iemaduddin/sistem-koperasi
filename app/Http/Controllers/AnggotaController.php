<?php

namespace App\Http\Controllers;

use App\Http\Requests\Anggota\SetKeluarAnggotaRequest;
use App\Http\Requests\Anggota\StoreAnggotaRequest;
use App\Http\Requests\Anggota\UpdateAnggotaRequest;
use App\Models\Anggota;
use App\Services\AnggotaService;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AnggotaController extends Controller
{
    public function __construct(private readonly AnggotaService $anggotaService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('Anggota/Index', [
            'anggota' => $this->anggotaService->getAnggotaIndexData(),
            'statusOptions' => $this->anggotaService->getStatusOptions(),
        ]);
    }

    public function store(StoreAnggotaRequest $request): RedirectResponse
    {
        $this->anggotaService->createAnggota($request->validated());

        return redirect()
            ->route('anggota.index')
            ->with('success', 'Data anggota berhasil ditambahkan.');
    }

    public function update(UpdateAnggotaRequest $request, Anggota $anggota): RedirectResponse
    {
        $this->anggotaService->updateAnggota($anggota, $request->validated());

        return redirect()
            ->route('anggota.index')
            ->with('success', 'Data anggota berhasil diperbarui.');
    }

    public function destroy(Anggota $anggota): RedirectResponse
    {
        try {
            $this->anggotaService->deleteAnggota($anggota);
        } catch (QueryException) {
            return redirect()
                ->route('anggota.index')
                ->with('error', 'Data anggota tidak dapat dihapus karena masih digunakan oleh data transaksi lain.');
        }

        return redirect()
            ->route('anggota.index')
            ->with('success', 'Data anggota berhasil dihapus.');
    }

    public function setKeluar(SetKeluarAnggotaRequest $request, Anggota $anggota): RedirectResponse
    {
        if ($anggota->status === 'keluar') {
            return redirect()
                ->route('anggota.index')
                ->with('error', 'Anggota sudah berstatus keluar.');
        }

        $validated = $request->validated();
        $approvedBy = $request->user()?->id;

        $this->anggotaService->setKeluar($anggota, $validated, $approvedBy);

        return redirect()
            ->route('anggota.index')
            ->with('success', 'Status anggota berhasil diubah menjadi keluar.');
    }
}
