<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class LogBagiHasilDeposito extends Model implements AuditableContract
{
    use HasFactory, Auditable;

    protected $table = 'log_bagi_hasil_deposito';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'simpanan_deposito_id',
        'nominal_bagi_hasil',
        'tanggal_perhitungan',
        'status_pengambilan',
        'tanggal_pengambilan',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'nominal_bagi_hasil' => 'decimal:2',
            'tanggal_perhitungan' => 'date',
            'tanggal_pengambilan' => 'datetime',
        ];
    }

    public function simpananDeposito(): BelongsTo
    {
        return $this->belongsTo(SimpananDeposito::class, 'simpanan_deposito_id');
    }
}
