<?php

namespace App\Http\Controllers;

use App\Http\Requests\Users\StoreRoleRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\UserManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function __construct(private readonly UserManagementService $userManagementService)
    {
    }

    public function index(): Response
    {
       
        $data = $this->userManagementService->getUserManagementIndexData();
        return Inertia::render('Users/Index', $data);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userManagementService->createUser($request->validated());

        return redirect()
            ->route('users.index')
            ->with('success', 'User berhasil ditambahkan.');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        if ($user->hasRole('Master Admin') && ! $request->user()?->is($user)) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Master Admin tidak dapat diedit.');
        }
        if ($user->hasRole('Super Admin') && ! $request->user()?->is($user)) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Super Admin tidak dapat diedit.');
        }

        $this->userManagementService->updateUser($user, $request->validated());

        return redirect()
            ->route('users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->hasRole('Master Admin')) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Master Admin tidak dapat dihapus.');
        }
        if ($user->hasRole('Super Admin')) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Super Admin tidak dapat dihapus.');
        }

        if ($request->user()?->is($user)) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        $this->userManagementService->deleteUser($user);

        return redirect()
            ->route('users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    public function block(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Anda tidak dapat memblokir akun sendiri.');
        }

        if ($user->hasRole('Master Admin') || $user->hasRole('Super Admin')) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Master Admin dan Super Admin tidak dapat diblokir.');
        }

        $this->userManagementService->blockUser($user);

        return redirect()
            ->route('users.index')
            ->with('success', 'User berhasil diblokir.');
    }

    public function unblock(User $user): RedirectResponse
    {
        if ($user->hasRole('Master Admin') || $user->hasRole('Super Admin')) {
            return redirect()
                ->route('users.index')
                ->with('error', 'Master Admin dan Super Admin tidak dapat diubah status blokirnya.');
        }

        $this->userManagementService->unblockUser($user);

        return redirect()
            ->route('users.index')
            ->with('success', 'User berhasil dibuka blokirnya.');
    }
}
