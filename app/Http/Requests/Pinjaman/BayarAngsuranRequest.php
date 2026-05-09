<?php

namespace App\Http\Requests\Pinjaman;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BayarAngsuranRequest extends FormRequest
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
            'angsuran_id'   => ['required', 'uuid', Rule::exists('angsuran_pinjaman', 'id')],
            'jumlah_bayar'  => ['required', 'numeric', 'min:0.01'],
            'denda_dibayar' => ['nullable', 'numeric', 'min:0'],
            'tanggal_bayar' => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'angsuran_id.required'  => 'Angsuran wajib dipilih.',
            'angsuran_id.exists'    => 'Angsuran tidak ditemukan.',
            'jumlah_bayar.required' => 'Jumlah bayar wajib diisi.',
            'jumlah_bayar.min'      => 'Jumlah bayar minimal Rp 0.01.',
            'tanggal_bayar.required'=> 'Tanggal bayar wajib diisi.',
            'tanggal_bayar.date'    => 'Tanggal bayar tidak valid.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'denda_dibayar' => $this->input('denda_dibayar', 0),
        ]);
    }
}
