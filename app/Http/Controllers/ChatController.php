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
        $currentUsername = $request->query('username');

        abort_unless(
            ! $currentUsername || User::query()->where('username', $currentUsername)->exists(),
            404,
        );

        /** @var User */
        $user = Auth::user();
        $id = $user->id;

        $data = [
            'contacts' => Conversation::query()
                ->where('inviter_id', $id)
                ->orWhere('invited_id', $id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (Conversation $conversation) => (
                    $conversation->inviter_id !== $id ? $conversation->inviter : $conversation->invited
                )),
        ];

        if ($currentUsername) {
            $username = $user->username;

            $data['contact'] = User::query()
                ->where('username', $currentUsername)
                ->where(fn (Builder $query) => (
                    $query->whereRelation('addedContacts', 'username', $username)
                        ->orWhereRelation('linkedContacts', 'username', $username)
                ))
                ->first();
        }

        return inertia('Index', $data);
    }
}
