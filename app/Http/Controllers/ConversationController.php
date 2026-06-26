<?php

namespace App\Http\Controllers;

use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Inertia\Response;

class ConversationController extends Controller
{
    public function index(): ResourceCollection
    {
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
            'conversation' => $conversation->toResource(),
        ]);
    }
}
