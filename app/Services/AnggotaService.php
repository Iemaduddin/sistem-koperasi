<?php

namespace App\Services;

use App\Models\Anggota;
use App\Models\RiwayatKeluarAnggota;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnggotaService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAnggotaIndexData(): array
    {
        return Anggota::query()
            ->with([
                'riwayatKeluar' => fn ($query) => $query
                    ->with('disetujuiOleh')
                    ->orderByDesc('created_at'),
            ])
            ->orderBy('nama')
            ->get()
            ->map(function (Anggota $item): array {
                $riwayatKeluarTerakhir = $item->riwayatKeluar->first();

                return [
                    'id' => $item->id,
                    'no_anggota' => $item->no_anggota,
                    'nik' => $item->nik,
                    'nama' => $item->nama,
                    'alamat' => $item->alamat,
                    'no_hp' => $item->no_hp,
                    'no_hp_cadangan' => $item->no_hp_cadangan,
                    'status' => $item->status,
                    'tanggal_bergabung' => $item->tanggal_bergabung?->toDateString(),
                    'tanggal_keluar' => $item->tanggal_keluar?->toDateString(),
                    'riwayat_keluar' => $riwayatKeluarTerakhir ? [
                        'alasan_keluar' => $riwayatKeluarTerakhir->alasan_keluar,
                        'tanggal_pengajuan' => $riwayatKeluarTerakhir->tanggal_pengajuan?->toDateString(),
                        'tanggal_disetujui' => $riwayatKeluarTerakhir->tanggal_disetujui?->toDateString(),
                        'disetujui_oleh' => $riwayatKeluarTerakhir->disetujuiOleh?->name,
                    ] : null,
                    'created_at' => $item->created_at?->toDateTimeString(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    public function getStatusOptions(): array
    {
        return ['aktif', 'nonaktif', 'keluar'];
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function createAnggota(array $payload): Anggota
    {
        return DB::transaction(function () use ($payload): Anggota {
            $joinDate = isset($payload['tanggal_bergabung'])
                ? Carbon::parse((string) $payload['tanggal_bergabung'])
                : now();

            $prefix = $joinDate->format('my');
            $nextSequence = $this->getNextNoAnggotaSequence($prefix);

            $payload['no_anggota'] = $prefix.str_pad(
                (string) $nextSequence,
                2,
                '0',
                STR_PAD_LEFT,
            );

            /** @var Anggota $anggota */
            $anggota = Anggota::query()->create($payload);

            return $anggota;
        });
    }

    private function getNextNoAnggotaSequence(string $prefix): int
    {
        $lastSequence = Anggota::query()
            ->where('no_anggota', 'like', $prefix.'%')
            ->lockForUpdate()
            ->selectRaw('MAX(CAST(SUBSTRING(no_anggota, 5) AS UNSIGNED)) as last_sequence')
            ->value('last_sequence');

        return ((int) $lastSequence) + 1;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function updateAnggota(Anggota $anggota, array $payload): Anggota
    {
        $anggota->update($payload);

        return $anggota;
    }

    public function deleteAnggota(Anggota $anggota): void
    {
        $anggota->delete();
    }

    /**
     * @param array{alasan_keluar: string, tanggal_keluar: string} $payload
     */
    public function setKeluar(Anggota $anggota, array $payload, ?string $approvedBy): void
    {
        DB::transaction(function () use ($anggota, $payload, $approvedBy): void {
            $tanggalKeluar = $payload['tanggal_keluar'];

            $anggota->update([
                'status' => 'keluar',
                'tanggal_keluar' => $tanggalKeluar,
            ]);

            RiwayatKeluarAnggota::query()->create([
                'anggota_id' => $anggota->id,
                'alasan_keluar' => $payload['alasan_keluar'],
                'tanggal_pengajuan' => $tanggalKeluar,
                'tanggal_disetujui' => $tanggalKeluar,
                'disetujui_oleh' => $approvedBy,
                'created_at' => now(),
            ]);
        });
    }
}
