<?php

namespace App\Http\Controllers;

use App\Http\Requests\JenisSimpanan\StoreJenisSimpananRequest;
use App\Http\Requests\JenisSimpanan\UpdateJenisSimpananRequest;
use App\Models\JenisSimpanan;
use App\Services\JenisSimpananService;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class JenisSimpananController extends Controller
{
    public function __construct(private readonly JenisSimpananService $jenisSimpananService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('JenisSimpanan/Index', [
            'jenis_simpanan' => $this->jenisSimpananService->getIndexData(),
        ]);
    }

    public function store(StoreJenisSimpananRequest $request): RedirectResponse
    {
        $this->jenisSimpananService->create($request->validated());

        return redirect()
            ->route('jenis-simpanan.index')
            ->with('success', 'Jenis simpanan berhasil ditambahkan.');
    }

    public function update(
        UpdateJenisSimpananRequest $request,
        JenisSimpanan $jenis_simpanan,
    ): RedirectResponse
    {
        $this->jenisSimpananService->update($jenis_simpanan, $request->validated());

        return redirect()
            ->route('jenis-simpanan.index')
            ->with('success', 'Jenis simpanan berhasil diperbarui.');
    }

    public function destroy(JenisSimpanan $jenis_simpanan): RedirectResponse
    {
        try {
            $this->jenisSimpananService->delete($jenis_simpanan);
        } catch (QueryException) {
            return redirect()
                ->route('jenis-simpanan.index')
                ->with('error', 'Jenis simpanan tidak dapat dihapus karena masih digunakan data lain.');
        }

        return redirect()
            ->route('jenis-simpanan.index')
            ->with('success', 'Jenis simpanan berhasil dihapus.');
    }
}
