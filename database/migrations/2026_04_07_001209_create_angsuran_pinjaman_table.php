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
        Schema::create('angsuran_pinjaman', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pinjaman_id')->constrained('pinjaman')->cascadeOnDelete();
            $table->integer('angsuran_ke');
            $table->date('tanggal_jatuh_tempo');
            $table->decimal('pokok', 15, 2);
            $table->decimal('bunga', 15, 2);
            $table->decimal('denda', 15, 2)->default(0);
            $table->decimal('total_tagihan', 15, 2);
            $table->decimal('jumlah_dibayar', 15, 2)->default(0);
            $table->enum('status', ['belum_bayar', 'sebagian', 'lunas'])->default('belum_bayar');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('angsuran_pinjaman');
    }
};
