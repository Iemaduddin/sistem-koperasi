<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransaksiSimpanan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'transaksi_simpanan';

    protected $keyType = 'string';

    public $incrementing = false;

    const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'rekening_simpanan_id',
        'batch_id',
        'jenis_transaksi',
        'jumlah',
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

    public function rekeningSimpanan(): BelongsTo
    {
        return $this->belongsTo(RekeningSimpanan::class, 'rekening_simpanan_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(TransaksiSimpananBatch::class, 'batch_id');
    }
}
