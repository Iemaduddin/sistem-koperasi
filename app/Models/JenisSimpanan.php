<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisSimpanan extends Model
{
    use HasFactory;

    protected $table = 'jenis_simpanan';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nama',
        'kode',
        'terkunci',
        'jumlah_minimum',
        'jumlah_maksimum',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'terkunci' => 'boolean',
            'jumlah_minimum' => 'decimal:2',
            'jumlah_maksimum' => 'decimal:2',
        ];
    }

    public function rekeningSimpanan(): HasMany
    {
        return $this->hasMany(RekeningSimpanan::class, 'jenis_simpanan_id');
    }
}
