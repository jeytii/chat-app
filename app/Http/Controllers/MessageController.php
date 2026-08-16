<?php

namespace App\Http\Controllers;

use App\Events\MessageEvent;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Response;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Arr;
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
            ->with('reference')
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
        $image = $request->safe()->file('image');

        if ($image) {
            $filename = Str::random(40).'.'.$image->extension();

            $payload['image'] = "chats/{$chat->id}/{$filename}";
        }

        $message = $chat->messages()
            ->create([
                ...$payload,
                'sender_id' => auth()->id(),
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
            $message->toArray($request->merge(['has_sender_id' => true])),
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

    #[Authorize('viewImage', ['message', 'chat'])]
    public function viewImage(Request $request, Chat $chat, Message $message): Response
    {
        return Image::fromStorage($message->image)
            ->toResponse($request)
            ->header('Cache-Control', 'private, max-age=86400, immutable');
    }
}
