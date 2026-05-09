<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class UserManagementService
{

    public function getUserManagementIndexData(): array
    {
         $users = User::query()
            ->with('roles')
            ->where(fn ($query) => $query->whereHas('roles', fn ($q) => $q->whereNotIn('name', ['Master Admin']))->orWhereDoesntHave('roles'))
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
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

        return compact('users', 'roles');
    }

    /**
    * @param array{name: string, email: string, is_active: bool, password: string, roles: array<int, string>} $payload
     */
    public function createUser(array $payload): User
    {
        return DB::transaction(function () use ($payload): User {
            $userData = Arr::except($payload, ['roles']);

            /** @var User $user */
            $user = User::query()->create($userData);
            $user->syncRoles($payload['roles']);

            return $user;
        });
    }

    /**
    * @param array{name: string, email: string, is_active: bool, password?: string, roles: array<int, string>} $payload
     */
    public function updateUser(User $user, array $payload): User
    {
        return DB::transaction(function () use ($user, $payload): User {
            $userData = Arr::except($payload, ['roles']);

            if (empty($userData['password'])) {
                unset($userData['password']);
            }

            $user->fill($userData);
            $user->save();
            $user->syncRoles($payload['roles']);

            return $user;
        });
    }

    public function deleteUser(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $user->syncRoles([]);
            $user->delete();
        });
    }

    public function blockUser(User $user): void
    {
        $user->update(['is_active' => false]);
    }

    public function unblockUser(User $user): void
    {
        $user->update(['is_active' => true]);
    }
}
