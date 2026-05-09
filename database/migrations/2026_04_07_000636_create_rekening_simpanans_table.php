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
        Schema::create('rekening_simpanan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('anggota_id')->constrained('anggota')->cascadeOnDelete();
            $table->foreignId('jenis_simpanan_id')->constrained('jenis_simpanan')->cascadeOnDelete();
            $table->decimal('saldo', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['anggota_id', 'jenis_simpanan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rekening_simpanan');
    }
};
