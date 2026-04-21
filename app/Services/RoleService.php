<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class RoleService
{
    public function getRoleIndexData(): array
    {
        $roles = Role::query()
            ->with('permissions')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => [
                'uuid' => $role->uuid,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->values()->all(),
                'is_system_role' => in_array($role->name, ['Master Admin', 'Super Admin', 'Admin']),
            ])
            ->values()
            ->all();

        $permissions = Permission::query()
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->all();

        return compact('roles', 'permissions');
    }

    /**
     * @param array{name: string, permissions: array<int, string>} $payload
     */
    public function createRole(array $payload): Role
    {
        return DB::transaction(function () use ($payload): Role {
            /** @var Role $role */
            $role = Role::query()->create([
                'name' => $payload['name'],
                'guard_name' => 'web',
            ]);

            if (!empty($payload['permissions'])) {
                $role->syncPermissions($payload['permissions']);
            }

            return $role;
        });
    }

    /**
     * @param array{name: string, permissions: array<int, string>} $payload
     */
    public function updateRole(Role $role, array $payload): Role
    {
        return DB::transaction(function () use ($role, $payload): Role {
            if (!in_array($role->name, ['Master Admin', 'Super Admin', 'Admin'])) {
                $role->update(['name' => $payload['name']]);
            }

            $role->syncPermissions($payload['permissions'] ?? []);

            return $role;
        });
    }

    public function deleteRole(Role $role): void
    {
        if (in_array($role->name, ['Master Admin', 'Super Admin', 'Admin'])) {
            throw new \Exception('System role cannot be deleted.');
        }

        DB::transaction(function () use ($role): void {
            $role->syncPermissions([]);
            $role->delete();
        });
    }
}
