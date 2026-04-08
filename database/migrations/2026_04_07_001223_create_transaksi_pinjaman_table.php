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
        Schema::create('transaksi_pinjaman', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pinjaman_id')->constrained('pinjaman')->cascadeOnDelete();
            $table->foreignUuid('angsuran_id')->constrained('angsuran_pinjaman')->cascadeOnDelete();
            $table->decimal('jumlah_bayar', 15, 2);
            $table->decimal('denda_dibayar', 15, 2)->default(0);
            $table->dateTime('tanggal_bayar');
            $table->timestamp('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi_pinjaman');
    }
};
