<?php

namespace App\Http\Controllers;

use App\Events\MessageEvent;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Image;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
    public function store(Request $request, Chat $chat): JsonResource
    {
        $data = $request->validate([
            'reference_id' => ['bail', 'nullable', 'integer', 'exists:messages,id'],
            'content' => ['nullable', 'required_without:file', 'string'],
            'file' => [
                'nullable',
                'required_without:content',
                Rule::anyOf([
                    ['image', 'mimes:jpg,png,webp'],
                    ['string', 'starts_with:https://', 'ends_with:.gif'],
                ]),
            ],
        ]);

        $file = data_get($data, 'file');

        $message = $chat->messages()
            ->create([
                ...Arr::only($data, ['reference_id', 'content']),
                'sender_id' => auth()->id(),
                'image' => $file instanceof UploadedFile ? $file->store("chats/{$chat->id}") : null,
                'gif' => \is_string($file) ? $file : null,
                'seen_at' => $request->boolean('seen') ? now() : null,
            ])
            ->toResource();

        broadcast(new MessageEvent(
            'MessageSent',
            $chat->id,
            $message->toArray($request->merge(['has_sender_id' => true])),
        ))->toOthers();

        return $message;
    }

    #[Authorize('update', 'message')]
    public function update(Request $request, Chat $chat, Message $message): JsonResource
    {
        $data = $request->validate([
            'reference_id' => ['nullable', 'integer', Rule::in([$message->reference_id])],
            'content' => [
                'nullable',
                'required_without_all:image,gif',
                'string',
            ],
            'image' => [
                'nullable',
                'required_without_all:content,gif',
                Rule::anyOf([
                    ['image', 'mimes:jpg,png,webp'],
                    ['string'],
                ]),
            ],
            'gif' => [
                'nullable',
                'required_without_all:content,image',
                'string',
                'starts_with:https://',
                'ends_with:.gif',
            ],
        ]);

        $payload = Arr::only($data, ['content', 'gif']);
        $image = data_get($data, 'image');

        if (! data_get($data, 'reference_id')) {
            $payload['reference_id'] = null;
        }

        if ($image instanceof UploadedFile) {
            $dir = "chats/{$chat->id}";
            $filename = Str::random(40).'.'.$image->extension();

            $payload['image'] = "{$dir}/{$filename}";
        } else {
            $payload['image'] = $image;
        }

        $updated = $message->update($payload);

        if ($updated) {
            if ($image instanceof UploadedFile) {
                $paths = explode('/', $message->image);

                $image->storeAs(
                    implode('/', \array_slice($paths, 0, -1)),
                    end($paths),
                );
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
