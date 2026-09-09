<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserPolicy
{
    public function sendRequest(User $user, User $model): bool
    {
        return $user->id !== $model->id
            && $user->chats()->whereRelation('users', 'users.id', $model->id)->doesntExist()
            && DB::table('requests')
                ->where(['sender_id', $model->id, 'receiver_id' => $user->id])
                ->orWhere(['sender_id', $user->id, 'receiver_id' => $model->id])
                ->doesntExist();
    }

    public function acceptRequest(User $user, User $model): bool
    {
        return $user->id !== $model->id
            && $user->chats()->whereRelation('users', 'users.id', $model->id)->doesntExist()
            && $user->receivedRequests()->where('id', $model->id)->exists();
    }
}
