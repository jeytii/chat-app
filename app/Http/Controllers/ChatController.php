<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChatResource;
use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Routing\Attributes\Controllers\Authorize;
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
            ->get();

        return ChatResource::collection($chats);
    }

    #[Authorize('view', 'chat')]
    public function show(Chat $chat): Response
    {
        return inertia('chat', [
            'chat_id' => $chat->id,
        ]);
    }
}
