<?php

namespace App\Services;

use App\Models\AngsuranPinjaman;
use App\Models\LogBagiHasilDeposito;
use App\Models\SimpananDeposito;
use App\Models\User;
use Illuminate\Support\Carbon;

class NotificationService
{
    public function getDashboardNotifications(?User $user): array
    {
        if (! $user) {
            return $this->emptyNotifications();
        }

        $today = now()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();
        $reminderStartDate = now()->addDay()->toDateString();
        $reminderEndDate = now()->addDays(2)->toDateString();

        $overdueAngsuranCount = AngsuranPinjaman::query()
            ->where('status', '!=', 'lunas')
            ->whereDate('tanggal_jatuh_tempo', '<', $today)
            ->count();

        $upcomingAngsuranCount = AngsuranPinjaman::query()
            ->where('status', '!=', 'lunas')
            ->whereDate('tanggal_jatuh_tempo', '>=', $today)
            ->whereDate('tanggal_jatuh_tempo', '<=', $endOfMonth)
            ->count();

        $depositoReminderCount = SimpananDeposito::query()
            ->where('status', 'aktif')
            ->whereDate('tanggal_selesai', '>=', $reminderStartDate)
            ->whereDate('tanggal_selesai', '<=', $reminderEndDate)
            ->count();

        return [
            'count' => $overdueAngsuranCount + $upcomingAngsuranCount + $depositoReminderCount,
            'angsuran' => [
                'count' => $overdueAngsuranCount + $upcomingAngsuranCount,
                'overdue_count' => $overdueAngsuranCount,
                'upcoming_count' => $upcomingAngsuranCount,
                'overdue' => $this->getOverdueAngsuranItems($today),
                'upcoming' => $this->getUpcomingAngsuranItems($today, $endOfMonth),
            ],
            'deposito' => [
                'count' => $depositoReminderCount,
                'reminders' => $this->getDepositoReminderItems(
                    $reminderStartDate,
                    $reminderEndDate,
                ),
            ],
        ];
    }

    private function emptyNotifications(): array
    {
        return [
            'count' => 0,
            'angsuran' => [
                'count' => 0,
                'overdue_count' => 0,
                'upcoming_count' => 0,
                'overdue' => [],
                'upcoming' => [],
            ],
            'deposito' => [
                'count' => 0,
                'reminders' => [],
            ],
        ];
    }

    private function getOverdueAngsuranItems(string $today): array
    {
        return AngsuranPinjaman::query()
            ->with(['pinjaman.anggota'])
            ->where('status', '!=', 'lunas')
            ->whereDate('tanggal_jatuh_tempo', '<', $today)
            ->orderBy('tanggal_jatuh_tempo', 'desc')
            ->limit(10)
            ->get()
            ->map(function (AngsuranPinjaman $item) {
                $diff = (int) now()->startOfDay()->diffInDays($item->tanggal_jatuh_tempo->startOfDay(), false);

                return [
                    'id' => 'angsuran-' . $item->id,
                    'type' => 'Angsuran Pinjaman',
                    'anggota_nama' => $item->pinjaman->anggota->nama,
                    'tanggal' => $item->tanggal_jatuh_tempo->format('d M Y'),
                    'nominal' => (float) $item->total_tagihan,
                    'label' => 'Terlambat ' . abs($diff) . ' hari',
                    'url' => '/pinjaman/' . $item->pinjaman_id,
                ];
            })
            ->values()
            ->all();
    }

    private function getUpcomingAngsuranItems(string $today, string $endOfMonth): array
    {
        return AngsuranPinjaman::query()
            ->with(['pinjaman.anggota'])
            ->where('status', '!=', 'lunas')
            ->whereDate('tanggal_jatuh_tempo', '>=', $today)
            ->whereDate('tanggal_jatuh_tempo', '<=', $endOfMonth)
            ->orderBy('tanggal_jatuh_tempo', 'asc')
            ->limit(10)
            ->get()
            ->map(function (AngsuranPinjaman $item) {
                $diff = (int) now()->startOfDay()->diffInDays($item->tanggal_jatuh_tempo->startOfDay(), false);
                $label = $diff === 0 ? 'Hari Ini' : 'H-' . $diff;

                return [
                    'id' => 'angsuran-' . $item->id,
                    'type' => 'Angsuran Pinjaman',
                    'anggota_nama' => $item->pinjaman->anggota->nama,
                    'tanggal' => $item->tanggal_jatuh_tempo->format('d M Y'),
                    'nominal' => (float) $item->total_tagihan,
                    'label' => $label,
                    'url' => '/pinjaman/' . $item->pinjaman_id,
                ];
            })
            ->values()
            ->all();
    }

    private function getDepositoReminderItems(string $startDate, string $endDate): array
    {
        return LogBagiHasilDeposito::query()
            ->with(['simpananDeposito.anggota'])
            ->where('status_pengambilan', 'belum')
            ->whereDate('tanggal_perhitungan', '>=', $startDate)
            ->whereDate('tanggal_perhitungan', '<=', $endDate)
            ->orderBy('tanggal_perhitungan', 'asc')
            ->limit(10)
            ->get()
            ->map(function (LogBagiHasilDeposito $item) {
                $deposito = $item->simpananDeposito;
                $anggota = $deposito?->anggota;
                $hariTersisa = (int) Carbon::today()->diffInDays(Carbon::parse((string) $item->tanggal_perhitungan)->startOfDay());
                $title = $hariTersisa === 1 ? '1 hari lagi' : '2 hari lagi';

                return [
                    'id' => (int) $item->id,
                    'simpanan_deposito_id' => (string) $item->simpanan_deposito_id,
                    'nominal_bagi_hasil' => (float) $item->nominal_bagi_hasil,
                    'tanggal_perhitungan' => Carbon::parse((string) $item->tanggal_perhitungan)->toDateString(),
                    'status_pengambilan' => $item->status_pengambilan,
                    'hari_tersisa' => $hariTersisa,
                    'title' => $title,
                    'simpanan_deposito' => [
                        'saldo' => (float) ($deposito?->saldo ?? 0),
                        'tanggal_mulai' => $deposito?->tanggal_mulai?->toDateString(),
                        'anggota' => [
                            'nama' => $anggota?->nama,
                            'no_anggota' => $anggota?->no_anggota,
                        ],
                    ],
                ];
            })
            ->values()
            ->all();
    }
}