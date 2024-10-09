<?php

namespace App\Http\Controllers;

use App\Events\AddedNewMessage;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $currentUsername = $request->query('username');

        /** @var User */
        $user = Auth::user();

        abort_unless(
            ! $currentUsername || $user->hasContact($currentUsername),
            404,
        );

        $id = $user->id;

        $data = [
            'contacts' => Conversation::query()
                ->where('inviter_id', $id)
                ->orWhere('invited_id', $id)
                ->orderByDesc('created_at')
                ->with(['inviter', 'invited'])
                ->withCount([
                    'messages as unread_messages_count' => fn (Builder $query) => (
                        $query->whereNot('sender_id', $id)->whereNull('read_at')
                    ),
                ])
                ->get()
                ->map(function (Conversation $conversation) use ($id) {
                    $data = $conversation->inviter_id !== $id ? $conversation->inviter : $conversation->invited;
                    $data['unread_messages_count'] = $conversation->unread_messages_count;

                    return $data;
                }),
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
            'username' => ['required', 'string'],
        ]);

        /** @var User */
        $user = Auth::user();

        abort_unless($user->hasContact($validated['username']), 403);

        $conversation = $this->getConversation($validated['username']);

        $messages = Message::query()
            ->where('conversation_id', $conversation->id)
            ->latest()
            ->simplePaginate(
                perPage: 30,
                page: $request->query('page') ?? 1,
            );

        return [
            'has_more' => $messages->hasMorePages(),
            'messages' => array_map(
                fn (Message $message) => [
                    ...$message->toArray(),
                    'from_self' => $message->sender_id === $user->id,
                ],
                array_reverse($messages->items())
            ),
        ];
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'message' => ['required', 'string'],
        ]);

        /** @var User */
        $user = Auth::user();

        abort_unless($user->hasContact($validated['username']), 403);

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
        broadcast(new AddedNewMessage($user->username, $message));

        return compact('message');
    }

    public function markMessagesAsRead(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
        ]);

        $conversation = $this->getConversation($validated['username']);

        $conversation->messages()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return ['success' => true];
    }

    protected function getConversation(string $username): Conversation
    {
        /** @var User */
        $user = Auth::user();
        $authId = $user->id;

        return Cache::remember("conversation.{$user->username}.{$username}", 3600, fn () => (
            Conversation::query()
                ->where(function (Builder $query) use ($authId, $username) {
                    $query->whereRelation('inviter', 'id', $authId)
                        ->whereRelation('invited', 'username', $username);
                })
                ->orWhere(function (Builder $query) use ($authId, $username) {
                    $query->whereRelation('inviter', 'username', $username)
                        ->whereRelation('invited', 'id', $authId);
                })
                ->first()
        ));
    }
}
