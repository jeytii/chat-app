<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('app', fn (User $user) => (
    $user->only(['name', 'username', 'profile_photo_url'])
));

Broadcast::channel('chat.{username}', fn (User $user, string $username) => (
    $user->username === $username ? true : $user->hasContact($username)
));
