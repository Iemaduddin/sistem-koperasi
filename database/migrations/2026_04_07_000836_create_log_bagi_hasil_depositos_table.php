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
        Schema::create('log_bagi_hasil_deposito', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('simpanan_deposito_id')->constrained('simpanan_deposito')->cascadeOnDelete();
            $table->decimal('nominal_bagi_hasil', 15, 2);
            $table->date('tanggal_perhitungan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_bagi_hasil_deposito');
    }
};
