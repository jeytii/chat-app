<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', fn (User $user, string $id): bool => (
    (bool) $user->email_verified_at && $user->id === $id
));

Broadcast::channel('chat.{id}', fn (User $user, string $id): bool => (
    $user->chats()->where('chats.id', $id)->exists()
));

Broadcast::channel('room.{id}', fn (User $user, string $id): string|bool => (
    $user->chats()->where('chats.id', $id)->exists() ? $user->id : false
));

Broadcast::channel('online', fn (User $user): string|bool => (
    (bool) $user->email_verified_at ? $user->email : false
));
