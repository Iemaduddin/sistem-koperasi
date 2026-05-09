<?php

namespace App\Http\Requests\RekeningKoperasi;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRekeningKoperasiRequest extends FormRequest
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
            'nomor_rekening' => ['required', 'string', 'max:255'],
            'jenis' => ['prohibited'],
            'saldo' => ['prohibited'],
        ];
    }


}
