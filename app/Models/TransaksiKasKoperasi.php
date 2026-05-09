<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TransaksiKasKoperasi extends Model implements AuditableContract
{
    use HasFactory, HasUuids, Auditable;

    protected $table = 'transaksi_kas_koperasi';

    protected $keyType = 'string';

    public $incrementing = false;

    const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'rekening_koperasi_id',
        'jenis',
        'jumlah',
        'sumber_tipe',
        'sumber_id',
        'user_id',
        'keterangan',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'jumlah' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function rekeningKoperasi(): BelongsTo
    {
        return $this->belongsTo(RekeningKoperasi::class, 'rekening_koperasi_id');
    }

    public function sumber(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'sumber_tipe', 'sumber_id');
    }
}
