<?php

namespace App\Http\Controllers;

use App\Services\RiwayatTransaksiImportService;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatTransaksiController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('RiwayatTransaksi/Index', [
            'import_summary' => session('riwayat_transaksi_import_summary'),
        ]);
    }
}
