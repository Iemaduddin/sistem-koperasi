<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Roles
        $masterAdminRole = Role::firstOrCreate(['name' => 'Master Admin']);
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);

        // 2. Assign All Permissions to Master Admin
        $masterAdminRole->syncPermissions(Permission::all());

        // 3. Assign Subset to Super Admin
        $superAdminRole->syncPermissions(Permission::whereIn('name', [
            'view users', 'create users', 'edit users', 'block users',
            'view anggota', 'create anggota', 'edit anggota', 'set keluar anggota',
            'manage rekening koperasi',
            'view simpanan', 'create simpanan', 'withdraw simpanan',
            'view pinjaman', 'create pinjaman', 'pay pinjaman', 'pelunasan pinjaman',
            'view deposito', 'create deposito', 'tarik bagi hasil deposito',
            'view audit', 'view laporan',
        ])->get());

        // 4. Assign Subset to Admin
        $adminRole->syncPermissions(Permission::whereIn('name', [
            'view users',
            'view anggota', 'create anggota', 'edit anggota',
            'view simpanan', 'create simpanan', 'withdraw simpanan',
            'view pinjaman', 'create pinjaman', 'pay pinjaman',
            'view deposito', 'create deposito',
            'view laporan',
        ])->get());

        // 5. Create Default Users
        $masterAdmin = User::firstOrCreate([
            'email' => 'masteradmin@azzahwa.com',
        ], [
            'name' => 'Master Admin',
            'password' => Hash::make('rinacantik'),
        ]);
        $masterAdmin->assignRole($masterAdminRole['name']);

        $superAdmin = User::firstOrCreate([
            'email' => 'superadmin@azzahwa.com',
        ], [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
        ]);
        $superAdmin->assignRole($superAdminRole['name']);

        $admin = User::firstOrCreate([
            'email' => 'admin@azzahwa.com',
        ], [
            'name' => 'Admin',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole($adminRole['name']);
    }
}
