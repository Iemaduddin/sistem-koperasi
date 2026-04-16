<?php

namespace App\Http\Requests\Deposito;

use Illuminate\Foundation\Http\FormRequest;

class TarikBagiHasilKumulatifRequest extends FormRequest
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
            'log_ids' => ['required', 'array', 'min:1'],
            'log_ids.*' => ['integer', 'distinct', 'min:1'],
        ];
    }
}
