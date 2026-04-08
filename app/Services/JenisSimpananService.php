<?php

namespace App\Services;

use App\Models\JenisSimpanan;
use Illuminate\Support\Facades\DB;

class JenisSimpananService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function getIndexData(): array
    {
        return JenisSimpanan::query()
            ->orderBy('nama')
            ->get()
            ->map(fn (JenisSimpanan $item): array => [
                'id' => (string) $item->id,
                'nama' => $item->nama,
                'kode' => $item->kode,
                'terkunci' => $item->terkunci,
                'jumlah_minimal' => $item->jumlah_minimum !== null ? (float) $item->jumlah_minimum : null,
                'jumlah_maksimal' => $item->jumlah_maksimum !== null ? (float) $item->jumlah_maksimum : null,
                'created_at' => $item->created_at?->toDateTimeString(),
                'updated_at' => $item->updated_at?->toDateTimeString(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): JenisSimpanan
    {
        return DB::transaction(function () use ($payload): JenisSimpanan {
            /** @var JenisSimpanan $jenisSimpanan */
            $jenisSimpanan = JenisSimpanan::query()->create([
                'nama' => $payload['nama'],
                'kode' => $payload['kode'],
                'terkunci' => (bool) $payload['terkunci'],
                'jumlah_minimum' => $payload['jumlah_minimal'] ?? null,
                'jumlah_maksimum' => $payload['jumlah_maksimal'] ?? null,
            ]);

            return $jenisSimpanan;
        });
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(JenisSimpanan $jenisSimpanan, array $payload): JenisSimpanan
    {
        return DB::transaction(function () use ($jenisSimpanan, $payload): JenisSimpanan {
            $jenisSimpanan->update([
                'nama' => $payload['nama'],
                'kode' => $payload['kode'],
                'terkunci' => (bool) $payload['terkunci'],
                'jumlah_minimum' => $payload['jumlah_minimal'] ?? null,
                'jumlah_maksimum' => $payload['jumlah_maksimal'] ?? null,
            ]);

            return $jenisSimpanan;
        });
    }

    public function delete(JenisSimpanan $jenisSimpanan): void
    {
        $jenisSimpanan->delete();
    }
}
