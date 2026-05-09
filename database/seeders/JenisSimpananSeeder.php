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
            ['nama' => 'Simpanan Pokok', 'kode' => 'POKOK', 'jumlah_minimum' => 100000, 'jumlah_maksimum' => 100000,'terkunci' =>true],
            ['nama' => 'Simpanan Wajib', 'kode' => 'WAJIB', 'jumlah_minimum' => 25000, 'jumlah_maksimum' => 500000,'terkunci' =>true],
            ['nama' => 'Simpanan Sukarela', 'kode' => 'SUKARELA', 'terkunci' =>false],
            ['nama' => 'Tabungan', 'kode' => 'TABUNGAN', 'terkunci' =>false],
            ['nama' => 'Biaya Operasional', 'kode' => 'OPERASIONAL', 'terkunci' =>false],
        ];

        foreach ($jenisSimpanan as $data) {
            \App\Models\JenisSimpanan::firstOrCreate($data);
        }
    }
}
