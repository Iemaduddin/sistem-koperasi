<?php

namespace App\Http\Controllers;

use App\Models\Pinjaman;
use App\Models\Simpanan;
use App\Models\SimpananDeposito;
use App\Models\TransaksiKasKoperasi;
use App\Models\TransaksiPinjaman;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatTransaksiController extends Controller
{
    public function index(Request $request): Response
    {
        $query = TransaksiKasKoperasi::query()
            ->with([
                'rekeningKoperasi',
                'sumber' => function ($morphTo) {
                    $morphTo->morphWith([
                        Simpanan::class => ['rekeningSimpanan.anggota', 'rekeningSimpanan.jenisSimpanan'],
                        Pinjaman::class => ['anggota'],
                        TransaksiPinjaman::class => ['angsuran.pinjaman.anggota'],
                        SimpananDeposito::class => ['anggota'],
                    ]);
                },
            ]);

        // Filter by Date Range
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Filter by Jenis (masuk/keluar)
        if ($request->filled('jenis') && $request->jenis !== 'all') {
            $query->where('jenis', $request->jenis);
        }

        // Filter by Sumber (simpanan/pinjaman/angsuran_pinjaman/deposito)
        if ($request->filled('sumber') && $request->sumber !== 'all') {
            $query->where('sumber_tipe', $request->sumber);
        }

        // Search in Keterangan or Member Name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('keterangan', 'like', "%{$search}%")
                    ->orWhereHasMorph('sumber', [
                        Simpanan::class,
                        Pinjaman::class,
                        TransaksiPinjaman::class,
                        SimpananDeposito::class,
                    ], function ($q, $type) use ($search) {
                        // Support both class names and morph map keys
                        if ($type === Simpanan::class || $type === 'simpanan') {
                            $q->whereHas('rekeningSimpanan.anggota', function ($q) use ($search) {
                                $q->where('nama', 'like', "%{$search}%");
                            });
                        } elseif ($type === Pinjaman::class || $type === 'pinjaman') {
                            $q->whereHas('anggota', function ($q) use ($search) {
                                $q->where('nama', 'like', "%{$search}%");
                            });
                        } elseif ($type === TransaksiPinjaman::class || $type === 'angsuran_pinjaman') {
                            $q->whereHas('angsuran.pinjaman.anggota', function ($q) use ($search) {
                                $q->where('nama', 'like', "%{$search}%");
                            });
                        } elseif ($type === SimpananDeposito::class || $type === 'deposito') {
                            $q->whereHas('anggota', function ($q) use ($search) {
                                $q->where('nama', 'like', "%{$search}%");
                            });
                        }
                    });
            });
        }

        $transactions = $query->latest('created_at')->get();

        return Inertia::render('RiwayatTransaksi/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['start_date', 'end_date', 'jenis', 'sumber', 'search']),
            'import_summary' => session('riwayat_transaksi_import_summary'),
        ]);
    }
}
