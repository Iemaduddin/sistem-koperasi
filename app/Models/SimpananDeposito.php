<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SimpananDeposito extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'simpanan_deposito';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'anggota_id',
        'rekening_koperasi_id',
        'saldo',
        'persen_bagi_hasil',
        'nominal_bagi_hasil',
        'tenor_bulan',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'saldo' => 'decimal:2',
            'persen_bagi_hasil' => 'decimal:2',
            'nominal_bagi_hasil' => 'decimal:2',
            'tenor_bulan' => 'integer',
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(Anggota::class, 'anggota_id');
    }

    public function rekeningKoperasi(): BelongsTo
    {
        return $this->belongsTo(RekeningKoperasi::class, 'rekening_koperasi_id');
    }

    public function logBagiHasil(): HasMany
    {
        return $this->hasMany(LogBagiHasilDeposito::class, 'simpanan_deposito_id');
    }
}
