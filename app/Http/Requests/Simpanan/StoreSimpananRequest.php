<?php

namespace App\Http\Requests\Simpanan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSimpananRequest extends FormRequest
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
            'jenis_transaksi' => ['required', Rule::in(['setor'])],
            'simpanan_pokok_jumlah' => ['nullable', 'numeric', 'min:0.01'],
            'simpanan_pokok_keterangan' => ['nullable', 'string', 'max:1000'],
            'simpanan_wajib_jumlah' => ['nullable', 'numeric', 'min:0.01'],
            'simpanan_wajib_keterangan' => ['nullable', 'string', 'max:1000'],
            'simpanan_sukarela_jumlah' => ['nullable', 'numeric', 'min:0.01'],
            'simpanan_sukarela_keterangan' => ['nullable', 'string', 'max:1000'],
            'alihkan_sisa_wajib_ke_sukarela' => ['nullable', 'boolean'],
            'created_at' => ['required', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'jenis_transaksi' => 'setor',
            'alihkan_sisa_wajib_ke_sukarela' => filter_var(
                $this->input('alihkan_sisa_wajib_ke_sukarela', false),
                FILTER_VALIDATE_BOOLEAN,
            ),
        ]);
    }
}