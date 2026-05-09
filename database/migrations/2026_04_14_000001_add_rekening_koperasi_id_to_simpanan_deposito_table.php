<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simpanan_deposito', function (Blueprint $table): void {
            $table->foreignUuid('rekening_koperasi_id')
                ->nullable()
                ->after('anggota_id')
                ->constrained('rekening_koperasi')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('simpanan_deposito', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('rekening_koperasi_id');
        });
    }
};
