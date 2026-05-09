<?php

namespace App\Http\Requests\JenisSimpanan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreJenisSimpananRequest extends FormRequest
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
            'kode' => ['required', 'string', 'max:255', 'unique:jenis_simpanan,kode'],
            'terkunci' => ['required', 'boolean'],
            'jumlah_minimal' => ['nullable', 'numeric', 'min:0'],
            'jumlah_maksimal' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $jumlahMinimal = $this->input('jumlah_minimal');
            $jumlahMaksimal = $this->input('jumlah_maksimal');

            if (
                $jumlahMinimal !== null &&
                $jumlahMinimal !== '' &&
                $jumlahMaksimal !== null &&
                $jumlahMaksimal !== '' &&
                (float) $jumlahMaksimal < (float) $jumlahMinimal
            ) {
                $validator->errors()->add(
                    'jumlah_maksimal',
                    'Jumlah maksimal harus lebih besar atau sama dengan jumlah minimal.',
                );
            }
        });
    }
}
