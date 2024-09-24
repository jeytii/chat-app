<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

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

    public function getMessages(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
        ]);

        $conversation = $this->getConversation($validated['username'], true);

        return [
            'messages' => $conversation->messages->map(function (Message $message) {
                $message['from_self'] = $message->sender_id === Auth::id();

                return $message;
            }),
        ];
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
            'message' => ['required', 'string'],
        ]);

        /** @var User */
        $user = Auth::user();

        $message = $user->messages()->create([
            'conversation_id' => $this->getConversation($validated['username'])->id,
            'content' => Str::markdown($validated['message'], [
                'html_input' => 'strip',
                'allow_unsafe_links' => false,
                'renderer' => [
                    'block_separator' => '<br>',
                    'inner_separator' => '<br>',
                    'soft_break' => '<br>',
                ],
            ]),
        ]);

        broadcast(new MessageSent($user->username, $message));

        return compact('message');
    }

    protected function getConversation(string $username, bool $getMessages = false): Conversation
    {
        $authId = Auth::id();

        return Conversation::query()
            ->where(function (Builder $query) use ($authId, $username) {
                $query->whereRelation('inviter', 'id', $authId)
                    ->whereRelation('invited', 'username', $username);
            })
            ->orWhere(function (Builder $query) use ($authId, $username) {
                $query->whereRelation('inviter', 'username', $username)
                    ->whereRelation('invited', 'id', $authId);
            })
            ->when($getMessages, fn (Builder $query) => $query->with('messages'))
            ->first();
    }
}
