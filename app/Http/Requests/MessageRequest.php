<?php

namespace App\Http\Requests;

use App\Models\Message;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MessageRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'content' => [
                'nullable',
                'required_without_all:image,gif',
                'string',
            ],
            'image' => [
                'nullable',
                'required_without_all:content,gif',
                'prohibits:gif',
                'image',
                'mimes:jpg,png,webp',
            ],
            'gif' => [
                'nullable',
                'required_without_all:content,image',
                'prohibits:image',
                'string',
                'starts_with:https://',
                'ends_with:.gif',
            ],
        ];

        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $message = $this->route('message');

            return [
                ...$rules,
                'reference_id' => ['nullable', 'string', Rule::in([$message->reference_id])],
                'image' => [
                    'nullable',
                    'required_without_all:content,gif',
                    'prohibits:gif',
                    Rule::anyOf([
                        ['image', 'mimes:jpg,png,webp'],
                        ['string'],
                    ]),
                ],
            ];
        }

        return [
            ...$rules,
            'reference_id' => [
                'bail',
                'nullable',
                'string',
                'exists:messages,id',
                function (string $attribute, mixed $value, Closure $fail) {
                    if (Message::find($value)?->chat_id !== $this->route('chat')->id) {
                        $fail('The given message does not exist.');
                    }
                },
            ],
        ];
    }
}
