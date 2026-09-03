<?php

namespace App\Http\Controllers;

use App\Events\MessageEvent;
use App\Events\MessageReaction;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\Message;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * @return array<string, JsonResource|string|null>
     */
    #[Authorize('viewAny', [Message::class, 'chat'])]
    public function index(Chat $chat): array
    {
        $messages = $chat->messages()
            ->when(
                /** @phpstan-ignore-next-line */
                $chat->users()->find(auth()->id())->pivot->cleared_at,
                fn (Builder $query, CarbonImmutable $date) => $query->where('created_at', '>', $date)
            )
            ->withTrashed()
            ->latest()
            ->with([
                'reference',
                'reactions' => fn (Relation $query) => (
                    // Group reactions by the unique emoji code
                    $query->select('message_id', 'reactions.name', 'emoji')
                        ->selectRaw('count(reactions.name) as total')
                        ->selectRaw(
                            // Append a custom attribute that determines if the user has already reacted with the current emoji
                            'EXISTS(SELECT 1 FROM reactions WHERE user_id = ? AND message_id = reactions.message_id AND name = reactions.name) AS has_reacted',
                            [auth()->id()],
                        )
                        ->groupBy('reactions.name')
                ),
            ])
            ->cursorPaginate(20);

        return [
            'items' => MessageResource::collection($messages->reverse()),
            'next_cursor' => $messages->nextCursor()?->encode(),
        ];
    }

    #[Authorize('create', [Message::class, 'chat'])]
    public function store(MessageRequest $request, Chat $chat): JsonResource
    {
        $payload = $request->validated();
        $user = $request->user();

        if ($image = data_get($payload, 'image')) {
            $this->limitAttachmentUpload("attachment-upload:{$user->id}");

            $payload['image'] = $image->store("chats/{$chat->id}");
        }

        $message = $chat->messages()
            ->create([
                ...$payload,
                'sender_id' => $user->id,
                'seen_at' => $request->boolean('seen') ? now() : null,
            ])
            ->toResource();

        broadcast(new MessageEvent(
            'MessageSent',
            $chat->id,
            $message->toArray($request->merge(['sender_email' => $user->email])),
        ))->toOthers();

        return $message;
    }

    #[Authorize('update', 'message')]
    public function update(MessageRequest $request, Chat $chat, Message $message): JsonResource
    {
        $payload = $request->validated();

        if ($image = $request->safe()->file('image')) {
            $this->limitAttachmentUpload("attachment-upload:{$request->user()->id}");

            $payload['image'] = $image->store("chats/{$chat->id}");
        }

        $message->update($payload);

        if ($message->wasChanged()) {
            broadcast(new MessageEvent(
                'MessageEdited',
                $chat->id,
                $message->load('reference')->toResource()->resource->only([
                    'id', 'reference', 'raw_content',
                    'content', 'image_url', 'gif', 'edited',
                ]),
            ))->toOthers();
        }

        return $message->toResource();
    }

    /**
     * @return array<string, bool>
     */
    #[Authorize('delete', 'message')]
    public function destroy(Chat $chat, Message $message): array
    {
        if ($message->delete()) {
            // Grant 5-second grace period to undo deletion
            dispatch(fn () => $this->markMessageAsDeleted($message))->delay(5);
        }

        return ['success' => true];
    }

    /**
     * @return array<string, bool>
     */
    #[Authorize('restore', 'message')]
    public function restore(Chat $chat, Message $message): array
    {
        $message->restore();

        return ['success' => true];
    }

    /**
     * @return array<string, bool>
     */
    #[Authorize('react', ['message', 'chat'])]
    public function react(Request $request, Chat $chat, Message $message): array
    {
        $data = $request->validate([
            'name' => 'required|string',
            'emoji' => 'required|string',
        ]);

        $user = $request->user();

        // User can't react with the same emoji twice
        if ($request->boolean('has_reacted')) {
            DB::table('reactions')
                ->where('user_id', $user->id)
                ->where('name', $data['name'])
                ->delete();
        } else {
            $message->reactions()->attachOrFail($user, $data);
        }

        // Broadcast the clicked reaction
        $reaction = $message
            ->load(['reactions' => fn (Relation $query) => (
                $query->select('message_id', 'reactions.name', 'emoji')
                    ->selectRaw('count(reactions.name) as total')
                    ->selectRaw(
                        'EXISTS(SELECT 1 FROM reactions WHERE user_id = ? AND name = ?) AS has_reacted',
                        [$user->id, $data['name']],
                    )
                    ->groupBy('reactions.name')
                    ->where('reactions.name', $data['name'])
            )])
            ->reactions
            ->first()
            ?->only(['name', 'emoji', 'total', 'has_reacted']);

        $broadcastData = $reaction ?? [
            ...$data,
            'total' => 0,
            'has_reacted' => false,
        ];

        broadcast(new MessageReaction($chat->id, $message->id, $broadcastData))->toOthers();

        return ['success' => true];
    }

    private function limitAttachmentUpload(string $key): void
    {
        abort_if(
            RateLimiter::tooManyAttempts($key, 5),
            429,
            __('You can only upload an attachment 5 times a day.'),
        );

        $decay = now()->endOfDay() |> now()->diffInSeconds(...) |> round(...);

        RateLimiter::increment($key, (int) $decay);
    }

    private function markMessageAsDeleted(Message $message): void
    {
        if (! $message->trashed()) {
            return;
        }

        if ($image = $message->image) {
            Storage::delete($image);
        }

        $message->update([
            'reference_id' => null,
            'content' => null,
            'image' => null,
            'gif' => null,
        ]);

        Broadcast::private("chat.{$message->chat_id}")
            ->as('MessageDeleted')
            ->with([
                'chat_id' => $message->chat_id,
                'id' => $message->id,
            ])
            ->toOthers()
            ->sendNow();

        Broadcast::presence("room.{$message->chat_id}")
            ->as('MessageDeleted')
            ->with($message->only('id'))
            ->toOthers()
            ->sendNow();
    }
}
