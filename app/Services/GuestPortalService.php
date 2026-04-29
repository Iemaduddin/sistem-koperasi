<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\Pinjaman;
use App\Models\SimpananDeposito;
use App\Models\TransaksiPinjaman;
use App\Models\TransaksiSimpanan;

class GuestPortalService
{
    public function findByNoAnggotaAndPhone(string $noAnggota): ?Anggota
    {
        return Anggota::query()
            ->where('no_anggota', $noAnggota)
            // ->where(function ($query) use ($noHp): void {
            //     $query->where('no_hp', $noHp)
            //         ->orWhere('no_hp_cadangan', $noHp);
            // })
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function getHistoryData(string $anggotaId): array
    {
        $anggota = Anggota::query()
            ->select([
                'id',
                'no_anggota',
                'nik',
                'nama',
                'alamat',
                'no_hp',
                'status',
                'tanggal_bergabung',
            ])
            ->findOrFail($anggotaId);

        $simpanan = TransaksiSimpanan::query()
            ->with(['rekeningSimpanan.jenisSimpanan'])
            ->whereHas('rekeningSimpanan', function ($query) use ($anggotaId): void {
                $query->where('anggota_id', $anggotaId);
            })
            ->latest('created_at')
            ->get()
            ->map(static fn (TransaksiSimpanan $item): array => [
                'id' => (string) $item->id,
                'jenis' => $item->jenis_transaksi,
                'kategori' => $item->rekeningSimpanan?->jenisSimpanan?->nama,
                'jumlah' => (float) $item->jumlah,
                'keterangan' => $item->keterangan,
                'tanggal' => $item->created_at?->toDateTimeString(),
            ])
            ->values()
            ->all();

        $pinjaman = Pinjaman::query()
            ->where('anggota_id', $anggotaId)
            ->latest('created_at')
            ->get()
            ->map(static fn (Pinjaman $item): array => [
                'id' => (string) $item->id,
                'jumlah_pinjaman' => (float) $item->jumlah_pinjaman,
                'bunga_persen' => (float) $item->bunga_persen,
                'tenor_bulan' => (int) $item->tenor_bulan,
                'jumlah_angsuran' => (float) $item->jumlah_angsuran,
                'tanggal_mulai' => $item->tanggal_mulai?->toDateString(),
                'status' => $item->status,
            ])
            ->values()
            ->all();

        $transaksiPinjaman = TransaksiPinjaman::query()
            ->with('pinjaman')
            ->whereHas('pinjaman', function ($query) use ($anggotaId): void {
                $query->where('anggota_id', $anggotaId);
            })
            ->latest('tanggal_bayar')
            ->get()
            ->map(static fn (TransaksiPinjaman $item): array => [
                'id' => (string) $item->id,
                'pinjaman_id' => (string) $item->pinjaman_id,
                'jumlah_bayar' => (float) $item->jumlah_bayar,
                'denda_dibayar' => (float) $item->denda_dibayar,
                'tanggal_bayar' => $item->tanggal_bayar?->toDateTimeString(),
            ])
            ->values()
            ->all();

        $deposito = SimpananDeposito::query()
            ->with(['rekeningKoperasi:id,nama,jenis', 'logBagiHasil'])
            ->where('anggota_id', $anggotaId)
            ->latest('created_at')
            ->get()
            ->map(static fn (SimpananDeposito $item): array => [
                'id' => (string) $item->id,
                'saldo' => (float) $item->saldo,
                'persen_bagi_hasil' => (float) $item->persen_bagi_hasil,
                'tenor_bulan' => (int) $item->tenor_bulan,
                'status' => $item->status,
                'tanggal_mulai' => $item->tanggal_mulai?->toDateString(),
                'tanggal_selesai' => $item->tanggal_selesai?->toDateString(),
                'rekening_koperasi' => $item->rekeningKoperasi ? [
                    'nama' => $item->rekeningKoperasi->nama,
                    'jenis' => $item->rekeningKoperasi->jenis,
                ] : null,
                'logs' => $item->logBagiHasil
                    ->sortBy('tanggal_perhitungan')
                    ->values()
                    ->map(static fn ($log): array => [
                        'id' => (int) $log->id,
                        'nominal_bagi_hasil' => (float) $log->nominal_bagi_hasil,
                        'tanggal_perhitungan' => $log->tanggal_perhitungan?->toDateString(),
                        'status_pengambilan' => $log->status_pengambilan,
                        'tanggal_pengambilan' => $log->tanggal_pengambilan?->toDateTimeString(),
                    ])
                    ->all(),
            ])
            ->values()
            ->all();

        return [
            'anggota' => [
                'id' => (string) $anggota->id,
                'no_anggota' => $anggota->no_anggota,
                'nik' => $anggota->nik,
                'nama' => $anggota->nama,
                'alamat' => $anggota->alamat,
                'no_hp' => $anggota->no_hp,
                'status' => $anggota->status,
                'tanggal_bergabung' => $anggota->tanggal_bergabung?->toDateString(),
            ],
            'summary' => [
                'total_simpanan' => count($simpanan),
                'total_pinjaman' => count($pinjaman),
                'total_pembayaran_pinjaman' => count($transaksiPinjaman),
                'total_deposito' => count($deposito),
            ],
            'simpanan' => $simpanan,
            'pinjaman' => $pinjaman,
            'transaksi_pinjaman' => $transaksiPinjaman,
            'deposito' => $deposito,
        ];
    }
}
