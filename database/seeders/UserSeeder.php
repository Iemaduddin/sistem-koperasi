<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
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
        $masterAdminRole = Role::firstOrCreate(['name' => 'Master Admin']);
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);

        $masterAdmin = User::firstOrCreate([
            'email' => 'masteradmin@azzahwa.com',
        ], [
            'name' => 'Master Admin',
            'password' => Hash::make('password'),
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
