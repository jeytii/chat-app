<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, Conversation $conversation): bool
    {
        return $conversation->requestor_id === $user->id || $conversation->accepter_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Conversation $conversation): bool
    {
        return $conversation->requestor_id === $user->id || $conversation->accepter_id === $user->id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id && ! $message->trashed();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }
}
