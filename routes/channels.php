<?php

use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{id}', function (User $user, int $id): bool {
    $chat = Chat::query()->find($id);

    return (bool) $chat && $chat->accepter_id === $user->id || $chat->requestor_id === $user->id;
});

Broadcast::channel('room.{id}', function (User $user, int $id) {
    $chat = Chat::query()->find($id);

    if (
        ! $chat
        || ($chat->accepter_id !== $user->id && $chat->requestor_id !== $user->id)
    ) {
        return false;
    }

    return $user->id;
});
