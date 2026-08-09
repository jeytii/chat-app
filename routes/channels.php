<?php

use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{id}', function (User $user, int $id): bool {
    $chat = Chat::query()->find($id);

    if (! $chat) {
        return false;
    }

    return $chat->accepter_id === $user->id || $chat->requestor_id === $user->id;
});
