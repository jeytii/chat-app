<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChatResource;
use App\Models\Chat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        abort_if($request->header('Sec-Fetch-Mode') === 'navigate', 404);

        $authId = auth()->id();
        $chats = Chat::query()
            ->where('accepter_id', $authId)
            ->orWhere('requestor_id', $authId)
            ->latest()
            ->with(['requestor', 'accepter'])
            ->withCount([
                'messages as unseen_messages_count' => fn (Builder $query) => (
                    $query->whereNot('sender_id', $authId)->whereNull('seen_at')
                ),
            ])
            ->get();

        return ChatResource::collection($chats);
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
}
