<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class TransaksiPinjaman extends Model implements AuditableContract
{
    use HasFactory, HasUuids, Auditable;

    protected $table = 'transaksi_pinjaman';

    protected $keyType = 'string';

    public $incrementing = false;

    const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'pinjaman_id',
        'angsuran_id',
        'jumlah_bayar',
        'denda_dibayar',
        'tanggal_bayar',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'jumlah_bayar' => 'decimal:2',
            'denda_dibayar' => 'decimal:2',
            'tanggal_bayar' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function pinjaman(): BelongsTo
    {
        return $this->belongsTo(Pinjaman::class, 'pinjaman_id');
    }

    public function angsuran(): BelongsTo
    {
        return $this->belongsTo(AngsuranPinjaman::class, 'angsuran_id');
    }
}
