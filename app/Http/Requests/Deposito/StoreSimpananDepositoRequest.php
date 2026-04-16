<?php

namespace App\Http\Requests\Deposito;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSimpananDepositoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'rekening_koperasi_id' => ['required', 'uuid', Rule::exists('rekening_koperasi', 'id')],
            'anggota_id' => ['required', 'uuid', Rule::exists('anggota', 'id')],
            'saldo' => ['required', 'numeric', 'min:0.01'],
            'tenor_bulan' => ['required', Rule::in([6, 12])],
            'persen_bagi_hasil' => ['nullable', 'numeric', 'min:0.01'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after:tanggal_mulai'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
            'log_bagi_hasil' => ['nullable', 'array'],
            'log_bagi_hasil.*.tanggal_perhitungan' => ['required_with:log_bagi_hasil', 'date'],
            'log_bagi_hasil.*.nominal_bagi_hasil' => ['required_with:log_bagi_hasil', 'numeric', 'min:0'],
            'created_at' => ['nullable', 'date'],
        ];
    }
}
