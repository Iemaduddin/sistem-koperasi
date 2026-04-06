<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class UserManagementService
{
    /**
     * @param array{name: string, email: string, password: string, roles: array<int, string>} $payload
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
     * @param array{name: string, email: string, password?: string, roles: array<int, string>} $payload
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
}
