<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatKeluarAnggota extends Model
{
    use HasFactory;

    protected $table = 'riwayat_keluar_anggota';

    const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'anggota_id',
        'alasan_keluar',
        'tanggal_pengajuan',
        'tanggal_disetujui',
        'disetujui_oleh',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_pengajuan' => 'date',
            'tanggal_disetujui' => 'date',
            'created_at' => 'datetime',
        ];
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(Anggota::class, 'anggota_id');
    }

    public function disetujuiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disetujui_oleh');
    }
}
