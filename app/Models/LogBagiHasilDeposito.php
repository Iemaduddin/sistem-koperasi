<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogBagiHasilDeposito extends Model
{
    use HasFactory;

    protected $table = 'log_bagi_hasil_deposito';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'simpanan_deposito_id',
        'nominal_bagi_hasil',
        'tanggal_perhitungan',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'nominal_bagi_hasil' => 'decimal:2',
            'tanggal_perhitungan' => 'date',
        ];
    }

    public function simpananDeposito(): BelongsTo
    {
        return $this->belongsTo(SimpananDeposito::class, 'simpanan_deposito_id');
    }
}
