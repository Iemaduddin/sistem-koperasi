<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RekeningKoperasi extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rekening_koperasi';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nama',
        'jenis',
        'nomor_rekening',
        'saldo',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'saldo' => 'decimal:2',
        ];
    }

    public function transaksiKas(): HasMany
    {
        return $this->hasMany(TransaksiKasKoperasi::class, 'rekening_koperasi_id');
    }
}
