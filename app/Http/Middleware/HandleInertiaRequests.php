<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->values()->all(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => [
                'count' => $user ? (\App\Models\AngsuranPinjaman::where('status', '!=', 'lunas')
                    ->whereDate('tanggal_jatuh_tempo', '<=', now()->addDays(2))
                    ->whereDate('tanggal_jatuh_tempo', '>=', now()->toDateString())
                    ->count() + \App\Models\SimpananDeposito::where('status', 'aktif')
                    ->whereDate('tanggal_selesai', '<=', now()->addDays(2))
                    ->whereDate('tanggal_selesai', '>=', now()->toDateString())
                    ->count()) : 0,
                'upcoming' => $user ? collect()
                    ->concat(\App\Models\AngsuranPinjaman::with(['pinjaman.anggota'])
                        ->where('status', '!=', 'lunas')
                        ->whereDate('tanggal_jatuh_tempo', '<=', now()->addDays(2))
                        ->whereDate('tanggal_jatuh_tempo', '>=', now()->toDateString())
                        ->get()
                        ->map(function ($item) {
                            $diff = (int)now()->startOfDay()->diffInDays($item->tanggal_jatuh_tempo->startOfDay(), false);
                            $label = $diff == 0 ? 'Hari Ini' : "H-$diff";

                            return [
                                'id' => 'angsuran-' . $item->id,
                                'type' => 'Angsuran',
                                'anggota_nama' => $item->pinjaman->anggota->nama,
                                'tanggal' => $item->tanggal_jatuh_tempo->format('d M Y'),
                                'nominal' => (float)$item->total_tagihan,
                                'label' => $label,
                                'url' => '/pinjaman/' . $item->pinjaman_id,
                            ];
                        }))
                    ->concat(\App\Models\SimpananDeposito::with(['anggota'])
                        ->where('status', 'aktif')
                        ->whereDate('tanggal_selesai', '<=', now()->addDays(2))
                        ->whereDate('tanggal_selesai', '>=', now()->toDateString())
                        ->get()
                        ->map(function ($item) {
                            $diff = (int)now()->startOfDay()->diffInDays($item->tanggal_selesai->startOfDay(), false);
                            $label = $diff == 0 ? 'Hari Ini' : "H-$diff";

                            return [
                                'id' => 'deposito-' . $item->id,
                                'type' => 'Jatuh Tempo Deposito',
                                'anggota_nama' => $item->anggota->nama,
                                'tanggal' => $item->tanggal_selesai->format('d M Y'),
                                'nominal' => (float)$item->saldo,
                                'label' => $label,
                                'url' => '/deposito',
                            ];
                        }))
                    ->sortBy(function ($item) {
                        return \Carbon\Carbon::createFromFormat('d M Y', $item['tanggal'])->timestamp;
                    })
                    ->values()
                    ->all() : [],
                'overdue' => $user ? collect()
                    ->concat(\App\Models\AngsuranPinjaman::with(['pinjaman.anggota'])
                        ->where('status', '!=', 'lunas')
                        ->whereDate('tanggal_jatuh_tempo', '<', now()->toDateString())
                        ->orderBy('tanggal_jatuh_tempo', 'desc')
                        ->limit(10)
                        ->get()
                        ->map(function ($item) {
                            $diff = (int)now()->startOfDay()->diffInDays($item->tanggal_jatuh_tempo->startOfDay(), false);

                            return [
                                'id' => 'angsuran-' . $item->id,
                                'type' => 'Angsuran',
                                'anggota_nama' => $item->pinjaman->anggota->nama,
                                'tanggal' => $item->tanggal_jatuh_tempo->format('d M Y'),
                                'nominal' => (float)$item->total_tagihan,
                                'label' => 'Terlambat ' . abs($diff) . ' hari',
                                'url' => '/pinjaman/' . $item->pinjaman_id,
                            ];
                        }))
                    ->concat(\App\Models\SimpananDeposito::with(['anggota'])
                        ->where('status', 'aktif')
                        ->whereDate('tanggal_selesai', '<', now()->toDateString())
                        ->orderBy('tanggal_selesai', 'desc')
                        ->limit(10)
                        ->get()
                        ->map(function ($item) {
                            $diff = (int)now()->startOfDay()->diffInDays($item->tanggal_selesai->startOfDay(), false);

                            return [
                                'id' => 'deposito-' . $item->id,
                                'type' => 'Jatuh Tempo Deposito',
                                'anggota_nama' => $item->anggota->nama,
                                'tanggal' => $item->tanggal_selesai->format('d M Y'),
                                'nominal' => (float)$item->saldo,
                                'label' => 'Terlambat ' . abs($diff) . ' hari',
                                'url' => '/deposito',
                            ];
                        }))
                    ->values()
                    ->all() : [],
                'overdue_count' => $user ? (\App\Models\AngsuranPinjaman::where('status', '!=', 'lunas')
                    ->whereDate('tanggal_jatuh_tempo', '<', now()->toDateString())
                    ->count() + \App\Models\SimpananDeposito::where('status', 'aktif')
                    ->whereDate('tanggal_selesai', '<', now()->toDateString())
                    ->count()) : 0,
            ],
        ];
    }
}
