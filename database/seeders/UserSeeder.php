<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use Illuminate\Support\Str;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdminRole = Role::firstOrCreate(['uuid' => Str::uuid(), 'name' => 'Super Admin']);
        $adminRole = Role::firstOrCreate(['uuid' => Str::uuid(), 'name' => 'Admin']);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@azzahwa.com',
            'password' => Hash::make('password'),
        ]);
        $superAdmin->assignRole($superAdminRole['name']);

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@azzahwa.com',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole($adminRole['name']);
    }
}
