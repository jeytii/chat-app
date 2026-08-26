<?php

namespace App\Policies;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, Chat $chat): bool
    {
        return $user->chats()->where('chats.id', $chat->id)->exists();
    }

    /**
     * Determine whether the user can view the attached image of the model.
     */
    public function viewImage(User $user, Message $message, Chat $chat): bool
    {
        return $user->chats()->where('chats.id', $chat->id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Chat $chat): bool
    {
        return $user->chats()->where('chats.id', $chat->id)->exists();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id
            && $message->trashed()
            && $message->deleted_at->diffInSeconds(now()) < 5;
    }

    /**
     * Determine whether the user can react to the model.
     */
    public function react(User $user, Message $message, Chat $chat): bool
    {
        return $user->chats()->where('chats.id', $chat->id)->exists();
    }
}
