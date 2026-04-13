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
        Schema::create('transaksi_simpanan_batch', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode_transaksi')->unique(); 
            $table->foreignUuid('anggota_id')->constrained('anggota');
            $table->dateTime('tanggal_transaksi');
            $table->foreignUuid('user_id')->constrained('users')->restrictOnDelete(); 
            $table->decimal('total', 18, 2)->default(0);
            $table->timestamps();

            $table->index(['anggota_id', 'tanggal_transaksi']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi_simpanan_batch');
    }
};
