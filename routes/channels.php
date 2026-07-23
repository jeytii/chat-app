<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversation.{id}', function (User $user, int $id): bool {
    $conversation = Conversation::query()->find($id);

    if (! $conversation) {
        return false;
    }

    return $conversation->accepter_id === $user->id || $conversation->requestor_id === $user->id;
});
