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
        Schema::create('transaksi_simpanan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('rekening_simpanan_id')->constrained('rekening_simpanan')->cascadeOnDelete();
            $table->enum('jenis_transaksi', ['setor', 'tarik']);
            $table->decimal('jumlah', 15, 2);
            $table->text('keterangan')->nullable();
            $table->timestamp('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi_simpanan');
    }
};
