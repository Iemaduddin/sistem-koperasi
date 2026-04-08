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
        Schema::create('simpanan_deposito', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('anggota_id')->constrained('anggota')->cascadeOnDelete();
            $table->decimal('saldo', 15, 2);
            $table->decimal('persen_bagi_hasil', 5, 2);
            $table->decimal('nominal_bagi_hasil', 15, 2)->default(0);
            $table->tinyInteger('tenor_bulan');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->enum('status', ['aktif', 'selesai'])->default('aktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simpanan_deposito');
    }
};
