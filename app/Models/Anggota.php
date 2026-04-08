<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Anggota extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'anggota';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'no_anggota',
        'nik',
        'nama',
        'alamat',
        'no_hp',
        'no_hp_cadangan',
        'status',
        'tanggal_bergabung',
        'tanggal_keluar',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_bergabung' => 'date',
            'tanggal_keluar' => 'date',
        ];
    }

    public function riwayatKeluar(): HasMany
    {
        return $this->hasMany(RiwayatKeluarAnggota::class, 'anggota_id');
    }

    public function rekeningSimpanan(): HasMany
    {
        return $this->hasMany(RekeningSimpanan::class, 'anggota_id');
    }

    public function simpananDeposito(): HasMany
    {
        return $this->hasMany(SimpananDeposito::class, 'anggota_id');
    }

    public function pinjaman(): HasMany
    {
        return $this->hasMany(Pinjaman::class, 'anggota_id');
    }
}
