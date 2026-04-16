<?php

namespace App\Http\Controllers;

use App\Services\GuestPortalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GuestPortalController extends Controller
{
    private const SESSION_ANGGOTA_ID = 'guest_portal.anggota_id';

    private const SESSION_VERIFIED_AT = 'guest_portal.verified_at';

    private const SESSION_TTL_SECONDS = 900;

    public function __construct(private readonly GuestPortalService $guestPortalService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('GuestPortal/Verify');
    }

    /**
     * @throws ValidationException
     */
    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nik' => ['required', 'string', 'size:16'],
            'no_hp' => ['required', 'string', 'regex:/^08[0-9]{8,13}$/'],
        ], [
            'nik.required' => 'NIK wajib diisi.',
            'nik.size' => 'NIK harus 16 karakter.',
            'no_hp.required' => 'No. HP wajib diisi.',
            'no_hp.regex' => 'Format No. HP tidak valid. Gunakan angka dan awali 08.',
        ]);

        $anggota = $this->guestPortalService->findByNikAndPhone(
            (string) $validated['nik'],
            (string) $validated['no_hp'],
        );

        if ($anggota === null) {
            throw ValidationException::withMessages([
                'auth' => 'NIK dan No. HP tidak cocok dengan data anggota.',
            ]);
        }

        $request->session()->put(self::SESSION_ANGGOTA_ID, (string) $anggota->id);
        $request->session()->put(self::SESSION_VERIFIED_AT, now()->timestamp);

        return redirect()->route('guest-portal.history');
    }

    public function history(Request $request): Response|RedirectResponse
    {
        $anggotaId = (string) ($request->session()->get(self::SESSION_ANGGOTA_ID) ?? '');
        $verifiedAt = (int) ($request->session()->get(self::SESSION_VERIFIED_AT) ?? 0);

        if ($anggotaId === '' || $verifiedAt === 0) {
            return redirect()
                ->route('guest-portal.index')
                ->with('error', 'Silakan verifikasi NIK dan No. HP terlebih dahulu.');
        }

        if ((now()->timestamp - $verifiedAt) > self::SESSION_TTL_SECONDS) {
            $request->session()->forget([
                self::SESSION_ANGGOTA_ID,
                self::SESSION_VERIFIED_AT,
            ]);

            return redirect()
                ->route('guest-portal.index')
                ->with('error', 'Sesi verifikasi sudah habis. Silakan verifikasi ulang.');
        }

        $data = $this->guestPortalService->getHistoryData($anggotaId);

        return Inertia::render('GuestPortal/History', $data);
    }

    public function reset(Request $request): RedirectResponse
    {
        $request->session()->forget([
            self::SESSION_ANGGOTA_ID,
            self::SESSION_VERIFIED_AT,
        ]);

        return redirect()->route('guest-portal.index');
    }
}
