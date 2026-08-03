<?php

namespace App\Http\Controllers;

use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Inertia\Response;

class ConversationController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        abort_if($request->header('Sec-Fetch-Mode') === 'navigate', 404);

        $authId = auth()->id();
        $conversations = Conversation::query()
            ->where('accepter_id', $authId)
            ->orWhere('requestor_id', $authId)
            ->latest()
            ->with(['requestor', 'accepter'])
            ->get();

        return ConversationResource::collection($conversations);
    }

    public function show(Conversation $conversation): Response
    {
        return inertia('conversation', [
            'conversation_id' => $conversation->id,
        ]);
    }
}
