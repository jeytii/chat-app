<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function sendRequest(User $user, User $model): bool
    {
        return $user->id !== $model->id && $user->sentRequests()->where('id', $model->id)->doesntExist();
    }

    public function acceptRequest(User $user, User $model): bool
    {
        return $user->id !== $model->id && $user->receivedRequests()->where('id', $model->id)->exists();
    }
}
