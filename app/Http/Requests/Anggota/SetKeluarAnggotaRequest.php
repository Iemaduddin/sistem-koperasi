<?php

namespace App\Http\Requests\Anggota;

use Illuminate\Foundation\Http\FormRequest;

class SetKeluarAnggotaRequest extends FormRequest
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
            'alasan_keluar' => ['required', 'string', 'max:2000'],
            'tanggal_keluar' => ['required', 'date'],
        ];
    }
}
