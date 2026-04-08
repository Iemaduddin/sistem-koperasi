<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AngsuranPinjaman extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'angsuran_pinjaman';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'pinjaman_id',
        'angsuran_ke',
        'tanggal_jatuh_tempo',
        'pokok',
        'bunga',
        'denda',
        'total_tagihan',
        'jumlah_dibayar',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'angsuran_ke' => 'integer',
            'tanggal_jatuh_tempo' => 'date',
            'pokok' => 'decimal:2',
            'bunga' => 'decimal:2',
            'denda' => 'decimal:2',
            'total_tagihan' => 'decimal:2',
            'jumlah_dibayar' => 'decimal:2',
        ];
    }

    public function pinjaman(): BelongsTo
    {
        return $this->belongsTo(Pinjaman::class, 'pinjaman_id');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(TransaksiPinjaman::class, 'angsuran_id');
    }
}
