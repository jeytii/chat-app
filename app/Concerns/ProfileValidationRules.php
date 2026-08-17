<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?string $userId = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // 'email' => [
            //     'required',
            //     'string',
            //     'email',
            //     'max:255',
            //     $userId === null
            //         ? Rule::unique(User::class)
            //         : Rule::unique(User::class)->ignore($userId),
            // ],
            'username' => [
                'required',
                'string',
                'min:8',
                'max:40',
                'regex:/^[^@]*$/',
                $userId === null
                    ? Rule::unique(User::class)
                    : Rule::unique(User::class)->ignore($userId),
            ],
        ];
    }
}
