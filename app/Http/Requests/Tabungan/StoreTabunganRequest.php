<?php

namespace App\Http\Requests\Tabungan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTabunganRequest extends FormRequest
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
            'jumlah' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
            'created_at' => ['required', 'date'],
        ];
    }
}
