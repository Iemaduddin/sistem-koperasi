<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pinjaman', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('anggota_id')->constrained('anggota')->cascadeOnDelete();
            $table->decimal('jumlah_pinjaman', 15, 2);
            $table->decimal('bunga_persen', 5, 2);
            $table->tinyInteger('tenor_bulan');
            $table->decimal('jumlah_angsuran', 15, 2); // estimasi saja
            $table->date('tanggal_mulai');
            $table->enum('status', ['aktif', 'lunas'])->default('aktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pinjaman');
    }
};
