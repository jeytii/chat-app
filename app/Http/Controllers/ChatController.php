<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

class ChatController extends Controller
{
    #[Authorize('viewAny', Chat::class)]
    public function index(Request $request): ResourceCollection
    {
        /** @var User */
        $user = $request->user();

        return $user->chats()
            ->where('hidden', false)
            ->orderByPivotDesc('created_at')
            ->with('users', fn (Relation $query) => $query->whereNot('users.id', $user->id))
            ->withCount([
                'messages as unseen_messages_count' => fn (Builder $query) => (
                    $query->whereNot('sender_id', $user->id)->whereNull('seen_at')
                ),
            ])
            ->get()
            ->toResourceCollection();
    }

    #[Authorize('view', 'chat')]
    public function show(Chat $chat): Response
    {
        DB::table('messages')
            ->where('chat_id', $chat->id)
            ->whereNot('sender_id', auth()->id())
            ->whereNull('seen_at')
            ->update(['seen_at' => now()]);

        return inertia('chat', [
            'chat_id' => $chat->id,
        ]);
    }

    #[Authorize('viewAny', Chat::class)]
    public function sentRequests(Request $request): ResourceCollection
    {
        return $request->user()
            ->sentRequests()
            ->orderByPivotDesc('created_at')
            ->get()
            ->toResourceCollection();
    }

    #[Authorize('viewAny', Chat::class)]
    public function receivedRequests(Request $request): ResourceCollection
    {
        return $request->user()
            ->receivedRequests()
            ->orderByPivotDesc('created_at')
            ->get()
            ->toResourceCollection();
    }
}
