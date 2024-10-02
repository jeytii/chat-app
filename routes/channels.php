<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

function shouldBroadcast(User $user, string $username) {
    if ($user->username === $username) {
        return false;
    }

    return $user->whereRelation('addedContacts', 'username', $username)
        ->orWhereRelation('linkedContacts', 'username', $username)
        ->exists();
}

Broadcast::channel('chat', fn (User $user) => $user->only(['name', 'username', 'profile_photo_url']));
Broadcast::channel('send.{username}', 'shouldBroadcast');
Broadcast::channel('count-unread-messages.{username}', 'shouldBroadcast');
