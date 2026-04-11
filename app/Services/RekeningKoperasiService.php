<?php

namespace App\Services;

use App\Models\RekeningKoperasi;
use Illuminate\Support\Facades\DB;

class RekeningKoperasiService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function getIndexData(): array
    {
        return RekeningKoperasi::query()
            ->orderBy('nama')
            ->get()
            ->map(fn (RekeningKoperasi $item): array => [
                'id' => (string) $item->id,
                'nama' => $item->nama,
                'jenis' => $item->jenis,
                'nomor_rekening' => $item->nomor_rekening,
                'saldo' => $item->saldo !== null ? (float) $item->saldo : null,
                'created_at' => $item->created_at?->toDateTimeString(),
                'updated_at' => $item->updated_at?->toDateTimeString(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): RekeningKoperasi
    {
        return DB::transaction(function () use ($payload): RekeningKoperasi {
            /** @var RekeningKoperasi $rekeningKoperasi */
            $rekeningKoperasi = RekeningKoperasi::query()->create([
                'nama' => $payload['nama'],
                'jenis' => $payload['jenis'],
                'nomor_rekening' => $payload['nomor_rekening'],
                'saldo' => $payload['saldo'] ?? null,
            ]);

            return $rekeningKoperasi;
        });
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(RekeningKoperasi $rekeningKoperasi, array $payload): RekeningKoperasi
    {
        return DB::transaction(function () use ($rekeningKoperasi, $payload): RekeningKoperasi {
            $rekeningKoperasi->update([
                'nama' => $payload['nama'],
                'nomor_rekening' => $payload['nomor_rekening'],
            ]);

            return $rekeningKoperasi;
        });
    }

}
