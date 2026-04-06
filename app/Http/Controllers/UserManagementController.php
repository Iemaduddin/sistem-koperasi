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
        $users = User::query()
            ->with('roles')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->values()->all(),
                'is_super_admin' => $user->hasRole('Super Admin'),
                'created_at' => $user->created_at?->toDateTimeString(),
            ])
            ->values()
            ->all();

        $roles = Role::query()
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->all();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
        ]);
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
}
