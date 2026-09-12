<?php

namespace App\Http\Requests;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Cache\Lock;
use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    protected ?Lock $lock = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $model = $this->route('user');

        return $this->routeIs('users.accept')
            ? $user->can('acceptRequest', $model)
            : $user->can('sendRequest', $model);
    }

    protected function prepareForValidation(): void
    {
        $prefix = $this->routeIs('users.accept') ? 'accept-request' : 'request-connection';

        $lock = cache()->lock("{$prefix}:{$this->route('user')->id}:{$this->user()->id}", 3);

        if (! $lock->get()) {
            throw new AuthorizationException;
        }

        $this->lock = $lock;
    }

    protected function failedAuthorization(): void
    {
        $this->lock?->release();

        parent::failedAuthorization();
    }

    protected function passedValidation(): void
    {
        $this->lock?->release();
    }
}
