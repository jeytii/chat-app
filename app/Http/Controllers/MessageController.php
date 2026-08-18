<?php

namespace App\Http\Controllers;

use App\Events\MessageEvent;
use App\Events\MessageReaction;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Response;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Image;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * @return array<string, JsonResource|string|null>
     */
    #[Authorize('viewAny', [Message::class, 'chat'])]
    public function index(Chat $chat): array
    {
        $messages = $chat->messages()
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
        $image = $request->safe()->file('image');

        if ($image) {
            $filename = Str::random(40).'.'.$image->extension();

            $payload['image'] = "chats/{$chat->id}/{$filename}";
        }

        $message = $chat->messages()
            ->create([
                ...$payload,
                'sender_id' => $user->id,
                'seen_at' => $request->boolean('seen') ? now() : null,
            ])
            ->toResource();

        if ($image) {
            $path = explode('/', $payload['image']);

            $image->storeAs("chats/{$chat->id}", end($path));
        }

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
        $payload = $request->safe()->except('image');
        $image = $request->safe()->file('image');

        if ($image) {
            $filename = Str::random(40).'.'.$image->extension();

            $payload['image'] = "chats/{$chat->id}/{$filename}";
        }

        if ($message->update($payload)) {
            if ($image) {
                $paths = explode('/', $message->image);

                $image->storeAs("chats/{$chat->id}", end($paths));
            }

            broadcast(new MessageEvent(
                'MessageEdited',
                $chat->id,
                Arr::only(
                    $message->load('reference')->toResource()->toArray($request),
                    ['id', 'reference', 'raw_content', 'content', 'edited'],
                ),
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
            broadcast(new MessageEvent(
                'MessageDeleted',
                $chat->id,
                $message->only('id'),
            ))->toOthers();
        }

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

    #[Authorize('viewImage', ['message', 'chat'])]
    public function viewImage(Request $request, Chat $chat, Message $message): Response
    {
        return Image::fromStorage($message->image)
            ->toResponse($request)
            ->header('Cache-Control', 'private, max-age=86400, immutable');
    }
}
