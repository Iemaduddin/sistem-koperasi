<?php

namespace App\Http\Controllers;

use App\Models\Pinjaman;
use App\Models\Simpanan;
use App\Models\SimpananDeposito;
use App\Models\TransaksiKasKoperasi;
use App\Models\TransaksiPinjaman;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatTransaksiController extends Controller
{
    public function index(): Response
    {
        $transactions = TransaksiKasKoperasi::query()
            ->select([
                'id',
                'created_at',
                'jenis',
                'sumber_tipe',
                'sumber_id',
                'keterangan',
                'jumlah',
            ])
            ->with([
                'sumber' => function ($morphTo) {
                    $morphTo->morphWith([
                        Simpanan::class => ['rekeningSimpanan.anggota:id,no_anggota,nama', 'rekeningSimpanan.jenisSimpanan:id,nama'],
                        Pinjaman::class => ['anggota:id,no_anggota,nama'],
                        TransaksiPinjaman::class => ['angsuran.pinjaman.anggota:id,no_anggota,nama'],
                        SimpananDeposito::class => ['anggota:id,no_anggota,nama'],
                    ]);
                },
            ])
            ->latest('created_at')
            ->get()
            ->map(function (TransaksiKasKoperasi $transaction): array {
                $sourceLabel = $transaction->sumber_tipe;
                $memberName = '-';
                $source = $transaction->sumber;

                if ($transaction->sumber_tipe === 'simpanan') {
                    $jenisSimpanan = $source?->rekeningSimpanan?->jenisSimpanan?->nama ?? 'Simpanan';
                    $sourceLabel = 'Simpanan ' . $jenisSimpanan;
                    $memberName = $source?->rekeningSimpanan?->anggota?->nama ?? '-';
                } elseif ($transaction->sumber_tipe === 'pinjaman') {
                    $sourceLabel = 'Pinjaman';
                    $memberName = $source?->anggota?->nama ?? '-';
                } elseif ($transaction->sumber_tipe === 'angsuran_pinjaman') {
                    $sourceLabel = 'Angsuran Pinjaman';
                    $memberName = $source?->angsuran?->pinjaman?->anggota?->nama ?? '-';
                } elseif ($transaction->sumber_tipe === 'deposito') {
                    $sourceLabel = 'Simpanan Deposito';
                    $memberName = $source?->anggota?->nama ?? '-';
                }

                return [
                    'id' => $transaction->id,
                    'created_at' => $transaction->created_at?->toISOString() ?? '',
                    'jenis' => $transaction->jenis,
                    'sumber_tipe' => $transaction->sumber_tipe,
                    'source_label' => $sourceLabel,
                    'member_name' => $memberName,
                    'keterangan' => $transaction->keterangan,
                    'jumlah' => $transaction->jumlah,
                ];
            });

        return Inertia::render('RiwayatTransaksi/Index', [
            'transactions' => $transactions,
            'import_summary' => session('riwayat_transaksi_import_summary'),
        ]);
    }
}
