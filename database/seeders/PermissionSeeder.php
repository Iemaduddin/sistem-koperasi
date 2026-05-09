<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // User Management
            'view users',
            'create users',
            'edit users',
            'delete users',
            'block users',
            
            // Role Management
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            
            // Anggota
            'view anggota',
            'create anggota',
            'edit anggota',
            'delete anggota',
            'set keluar anggota',
            
            // Master Data
            'manage jenis simpanan',
            'manage rekening koperasi',
            
            // Simpanan
            'view simpanan',
            'create simpanan',
            'withdraw simpanan',
            
            // Pinjaman
            'view pinjaman',
            'create pinjaman',
            'pay pinjaman',
            'pelunasan pinjaman',
            
            // Deposito
            'view deposito',
            'create deposito',
            'tarik bagi hasil deposito',
            
            // Analytics
            'view audit',
            'view laporan',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }
}
