<?php

namespace App\Http\Requests\RekeningKoperasi;

use Illuminate\Foundation\Http\FormRequest;

class StoreRekeningKoperasiRequest extends FormRequest
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
            'nama' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'in:tunai,bank'],
            'nomor_rekening' => ['required', 'string', 'max:255'],
            'saldo' => ['required', 'numeric', 'min:0'],
        ];
    }


}
