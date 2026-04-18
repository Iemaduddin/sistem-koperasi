<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Pinjaman extends Model implements AuditableContract
{
    use HasFactory, HasUuids, Auditable;

    protected $table = 'pinjaman';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'anggota_id',
        'jumlah_pinjaman',
        'bunga_persen',
        'tenor_bulan',
        'jumlah_angsuran',
        'tanggal_mulai',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'jumlah_pinjaman' => 'decimal:2',
            'bunga_persen' => 'decimal:2',
            'tenor_bulan' => 'integer',
            'jumlah_angsuran' => 'decimal:2',
            'tanggal_mulai' => 'date',
        ];
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(Anggota::class, 'anggota_id');
    }

    public function angsuran(): HasMany
    {
        return $this->hasMany(AngsuranPinjaman::class, 'pinjaman_id');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(TransaksiPinjaman::class, 'pinjaman_id');
    }
}
