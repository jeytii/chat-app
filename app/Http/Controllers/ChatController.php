<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        /** @var User */
        $user = Auth::user();
        $id = $user->id;
        $username = $user->username;

        $contacts = Conversation::query()
            ->where('inviter_id', $id)
            ->orWhere('invited_id', $id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Conversation $conversation) => (
                $conversation->inviter_id !== $id ? $conversation->inviter : $conversation->invited
            ));

        $contact = User::query()
            ->where('username', $request->query(('username')))
            ->where(fn (Builder $query) => (
                $query->whereRelation('addedContacts', 'username', $username)
                    ->orWhereRelation('linkedContacts', 'username', $username)
            ))
            ->first();

        return inertia('Index', compact('contacts', 'contact'));
    }
}
