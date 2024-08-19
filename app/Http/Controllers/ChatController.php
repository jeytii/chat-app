<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index()
    {
        $authId = Auth::id();
        $users = Conversation::query()
            ->where('inviter_id', $authId)
            ->orWhere('invited_id', $authId)
            ->get()
            ->map(fn (Conversation $conversation) => (
                $conversation->inviter_id !== $authId ? $conversation->inviter : $conversation->invited
            ));

        return inertia('Index', compact('users'));
    }
}
