<?php

namespace App\Http\Requests\RekapanAnggota;

use Illuminate\Foundation\Http\FormRequest;

class ImportRekapanAnggotaRequest extends FormRequest
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
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'],
            'mode' => ['nullable', 'in:dry-run,persist'],
            'rekening_koperasi_id' => ['required_if:mode,persist', 'nullable', 'exists:rekening_koperasi,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'File Excel wajib dipilih.',
            'file.file' => 'Upload tidak valid.',
            'file.mimes' => 'Format file harus xlsx atau xls.',
            'file.max' => 'Ukuran file maksimal 10MB.',
            'mode.in' => 'Mode import tidak valid.',
            'rekening_koperasi_id.required_if' => 'Rekening Koperasi wajib dipilih untuk menyimpan data.',
            'rekening_koperasi_id.exists' => 'Rekening Koperasi tidak valid.',
        ];
    }
}
