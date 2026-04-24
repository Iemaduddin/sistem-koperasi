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
                'count' => $user ? \App\Models\AngsuranPinjaman::where('status', '!=', 'lunas')
                    ->whereDate('tanggal_jatuh_tempo', '<=', now()->addDays(2))
                    ->whereDate('tanggal_jatuh_tempo', '>=', now()->toDateString())
                    ->count() : 0,
                'upcoming' => $user ? \App\Models\AngsuranPinjaman::with(['pinjaman.anggota'])
                    ->where('status', '!=', 'lunas')
                    ->whereDate('tanggal_jatuh_tempo', '<=', now()->addDays(2))
                    ->whereDate('tanggal_jatuh_tempo', '>=', now()->toDateString())
                    ->orderBy('tanggal_jatuh_tempo', 'asc')
                    ->get()
                    ->map(function ($item) {
                        $diff = now()->startOfDay()->diffInDays($item->tanggal_jatuh_tempo->startOfDay(), false);
                        $label = $diff == 0 ? 'Hari Ini' : "H-$diff";

                        return [
                            'id' => $item->id,
                            'anggota_nama' => $item->pinjaman->anggota->nama,
                            'tanggal_jatuh_tempo' => $item->tanggal_jatuh_tempo->format('d M Y'),
                            'total_tagihan' => (float)$item->total_tagihan,
                            'label' => $label,
                        ];
                    }) : [],
                'overdue' => $user ? \App\Models\AngsuranPinjaman::with(['pinjaman.anggota'])
                    ->where('status', '!=', 'lunas')
                    ->whereDate('tanggal_jatuh_tempo', '<', now()->toDateString())
                    ->orderBy('tanggal_jatuh_tempo', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function ($item) {
                        $diff = now()->startOfDay()->diffInDays($item->tanggal_jatuh_tempo->startOfDay(), false);
                        
                        return [
                            'id' => $item->id,
                            'anggota_nama' => $item->pinjaman->anggota->nama,
                            'tanggal_jatuh_tempo' => $item->tanggal_jatuh_tempo->format('d M Y'),
                            'total_tagihan' => (float)$item->total_tagihan,
                            'label' => 'Terlambat ' . abs($diff) . ' hari',
                        ];
                    }) : [],
                'overdue_count' => $user ? \App\Models\AngsuranPinjaman::where('status', '!=', 'lunas')
                    ->whereDate('tanggal_jatuh_tempo', '<', now()->toDateString())
                    ->count() : 0,
            ],
        ];
    }
}
