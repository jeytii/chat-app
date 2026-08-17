<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{id}', fn (User $user, string $id): bool => (
    $user->chats()->where('chats.id', $id)->exists()
));

Broadcast::channel('room.{id}', fn (User $user, string $id): string|bool => (
    $user->chats()->where('chats.id', $id)->exists() ? $user->id : false
));
