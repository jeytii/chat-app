<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

function shouldBroadcast(User $user, string $username) {
    return $user->username === $username ? false : $user->hasContact($username);
}

Broadcast::channel('app', fn (User $user) => $user->only(['name', 'username', 'profile_photo_url']));
Broadcast::channel('chat.{username}', 'shouldBroadcast');
Broadcast::channel('count-unread-messages.{username}', 'shouldBroadcast');
