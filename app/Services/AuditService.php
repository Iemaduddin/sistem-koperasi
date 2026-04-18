<?php

namespace App\Services;

use App\Models\Audit;

class AuditService
{
    /**
     * @return array{audits: array<int, array<string, mixed>>}
     */
    public function getIndexData(): array
    {
        $audits = Audit::query()
            ->with('user')
            ->latest('created_at')
            ->limit(1000)
            ->get()
            ->map(fn (Audit $audit): array => [
                'id' => (string) $audit->id,
                'waktu' => $audit->created_at?->toDateTimeString(),
                'event' => (string) $audit->event,
                'event_label' => $this->eventLabel((string) $audit->event),
                'model' => $this->modelLabel((string) $audit->auditable_type),
                'model_fqcn' => (string) $audit->auditable_type,
                'record_id' => (string) $audit->auditable_id,
                'user' => (string) ($audit->user?->name ?? 'System'),
                'ip_address' => $audit->ip_address,
                'url' => $audit->url,
                'ringkasan' => $this->buildSummary($audit),
                'changes' => $this->buildChanges($audit),
            ])
            ->values()
            ->all();

        return [
            'audits' => $audits,
        ];
    }

    /**
     * @return array<int, array{field: string, old_value: string, new_value: string}>
     */
    private function buildChanges(Audit $audit): array
    {
        $oldValues = $this->normalizeToArray($audit->old_values ?? []);
        $newValues = $this->normalizeToArray($audit->new_values ?? []);

        $ignored = ['created_at', 'updated_at', 'deleted_at'];
        $keys = array_values(array_unique(array_merge(array_keys($oldValues), array_keys($newValues))));

        $changes = [];
        foreach ($keys as $key) {
            if (in_array($key, $ignored, true)) {
                continue;
            }

            $oldValue = $oldValues[$key] ?? null;
            $newValue = $newValues[$key] ?? null;

            $changes[] = [
                'field' => (string) $key,
                'old_value' => $this->formatValue($oldValue),
                'new_value' => $this->formatValue($newValue),
            ];
        }

        return $changes;
    }

    private function buildSummary(Audit $audit): string
    {
        $eventLabel = $this->eventLabel((string) $audit->event);
        $modelLabel = $this->modelLabel((string) $audit->auditable_type);
        $changesCount = count($this->buildChanges($audit));

        if ($changesCount === 0) {
            return "{$eventLabel} {$modelLabel}";
        }

        return "{$eventLabel} {$modelLabel} ({$changesCount} perubahan)";
    }

    private function eventLabel(string $event): string
    {
        return match ($event) {
            'created' => 'Membuat',
            'updated' => 'Memperbarui',
            'deleted' => 'Menghapus',
            'restored' => 'Memulihkan',
            default => ucfirst($event),
        };
    }

    private function modelLabel(string $auditableType): string
    {
        $class = basename(str_replace('\\', '/', $auditableType));

        return match ($class) {
            'Anggota' => 'Anggota',
            'User' => 'User',
            'JenisSimpanan' => 'Jenis Simpanan',
            'RekeningKoperasi' => 'Rekening Koperasi',
            'RekeningSimpanan' => 'Rekening Simpanan',
            'Simpanan' => 'Transaksi Simpanan',
            'TransaksiSimpanan' => 'Transaksi Simpanan',
            'TransaksiSimpananBatch' => 'Batch Simpanan',
            'SimpananDeposito' => 'Deposito',
            'LogBagiHasilDeposito' => 'Log Bagi Hasil Deposito',
            'TransaksiKasKoperasi' => 'Transaksi Kas Koperasi',
            'Pinjaman' => 'Pinjaman',
            'AngsuranPinjaman' => 'Angsuran Pinjaman',
            'TransaksiPinjaman' => 'Transaksi Pinjaman',
            'RiwayatKeluarAnggota' => 'Riwayat Keluar Anggota',
            default => $class,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeToArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function formatValue(mixed $value): string
    {
        if ($value === null) {
            return '-';
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_scalar($value)) {
            $text = trim((string) $value);

            return $text === '' ? '-' : $text;
        }

        $json = json_encode($value);

        return $json !== false ? $json : '-';
    }
}
