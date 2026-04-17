<?php

namespace App\Http\Requests\Anggota;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnggotaRequest extends FormRequest
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
            'no_anggota' => ['required', 'string', 'max:255', 'unique:anggota,no_anggota'],
            'nik' => ['required', 'string', 'max:255', 'unique:anggota,nik'],
            'nama' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'no_hp' => ['required', 'string', 'max:255', 'regex:/^08[0-9]{8,13}$/', 'unique:anggota,no_hp'],
            'no_hp_cadangan' => ['nullable', 'string', 'max:255', 'regex:/^08[0-9]{8,13}$/'],
            'status' => ['required', Rule::in(['aktif', 'nonaktif', 'keluar'])],
            'tanggal_bergabung' => ['required', 'date'],
            'tanggal_keluar' => ['nullable', 'date', 'after_or_equal:tanggal_bergabung'],
        ];
    }
        public function messages(): array
    {
        return [
            'no_anggota.unique' => 'No. anggota sudah digunakan.',
            'nik.unique' => 'NIK sudah digunakan.',
            'no_hp.unique' => 'No. HP sudah digunakan oleh anggota lain.',
        ];
    }

}
