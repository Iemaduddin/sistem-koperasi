<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [
                'nullable',
                'string',
                'min:8',
                function ($attribute, $value, $fail) {
                    // Only validate 'confirmed' if password is not empty
                    if (!empty($value) && $this->input('password_confirmation') !== $value) {
                        $fail('Password confirmation does not match.');
                    }
                },
            ],
            'password_confirmation' => ['nullable', 'string'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => [
                'required',
                'string',
                'exists:roles,name',
                Rule::notIn(['Super Admin']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'roles.*.not_in' => 'Tidak dapat menugaskan role Super Admin.',
        ];
    }
}
