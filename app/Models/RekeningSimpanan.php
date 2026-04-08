<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RekeningSimpanan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rekening_simpanan';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'anggota_id',
        'jenis_simpanan_id',
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

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(Anggota::class, 'anggota_id');
    }

    public function jenisSimpanan(): BelongsTo
    {
        return $this->belongsTo(JenisSimpanan::class, 'jenis_simpanan_id');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(TransaksiSimpanan::class, 'rekening_simpanan_id');
    }
}
