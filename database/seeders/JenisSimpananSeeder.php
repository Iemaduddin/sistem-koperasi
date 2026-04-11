<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class JenisSimpananSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jenisSimpanan = [
            ['nama' => 'Simpanan Pokok', 'kode' => 'POKOK', 'minimal_simpanan' => 100000, 'maksimal_simpanan' => 100000,'terkunci' =>true],
            ['nama' => 'Simpanan Wajib', 'kode' => 'WAJIB', 'minimal_simpanan' => 25000, 'maksimal_simpanan' => 500000,'terkunci' =>true],
            ['nama' => 'Simpanan Sukarela', 'kode' => 'SUKARELA', 'terkunci' =>false],
        ];

        foreach ($jenisSimpanan as $data) {
            \App\Models\JenisSimpanan::firstOrCreate($data);
        }
    }
}
