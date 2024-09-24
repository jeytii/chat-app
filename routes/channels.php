<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat', function (User $user) {
    return $user->only(['name', 'username', 'profile_photo_url']);
});

Broadcast::channel('send.{username}', function (User $user, string $username) {
    if ($user->username === $username) {
        return false;
    }

    return $user->addedContacts()->where('username', $username)->exists()
        || $user->linkedContacts()->where('username', $username)->exists();
});
