<?php

namespace App\Http\Controllers;

use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MessageController extends Controller
{
    /**
     * @return array<string, JsonResource|string|null>
     */
    #[Authorize('viewAny', [Message::class, 'conversation'])]
    public function index(Conversation $conversation): array
    {
        $messages = $conversation->messages()
            ->withTrashed()
            ->latest()
            ->with('reference')
            ->cursorPaginate(20);

        return [
            'items' => MessageResource::collection($messages->reverse()),
            'next_cursor' => $messages->nextCursor()?->encode(),
        ];
    }

    #[Authorize('create', [Message::class, 'conversation'])]
    public function store(Request $request, Conversation $conversation): JsonResource
    {
        $data = $request->validate([
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

        if ($file instanceof UploadedFile) {
            $data['image'] = $file->store("conversations/{$conversation->id}");
        }

        if (\is_string($file)) {
            $data['gif'] = $file;
        }

        $message = auth()->user()
            ->messages()
            ->create([
                ...Arr::only($data, ['content', 'image', 'gif']),
                'conversation_id' => $conversation->id,
            ])
            ->toResource();

        Broadcast::private("conversation.{$conversation->id}")
            ->as('MessageSent')
            ->with([
                'event' => 'MessageSent',
                'message' => $message->toArray($request),
            ])
            ->toOthers()
            ->send();

        return $message;
    }

    #[Authorize('update', 'message')]
    public function update(Request $request, Conversation $conversation, Message $message): JsonResource
    {
        $data = $request->validate([
            'content' => ['required', 'string'],
        ]);

        if ($message->update(['content' => $data['content']])) {
            Broadcast::private("conversation.{$conversation->id}")
                ->as('MessageEdited')
                ->with([
                    'event' => 'MessageEdited',
                    'message' => Arr::only(
                        $message->toResource()->toArray($request),
                        ['id', 'raw_content', 'content', 'edited'],
                    ),
                ])
                ->toOthers()
                ->send();
        }

        return $message->toResource();
    }

    /**
     * @return array<string, bool>
     */
    #[Authorize('delete', 'message')]
    public function destroy(Conversation $conversation, Message $message): array
    {
        if ($message->delete()) {
            Broadcast::private("conversation.{$conversation->id}")
                ->as('MessageDeleted')
                ->with([
                    'event' => 'MessageDeleted',
                    'message' => $message->only('id'),
                ])
                ->toOthers()
                ->send();
        }

        return ['success' => true];
    }

    #[Authorize('viewImage', ['message', 'conversation'])]
    public function viewImage(Conversation $conversation, Message $message): StreamedResponse
    {
        return Storage::response(
            $message->image,
            headers: [
                'Cache-Control' => 'private, max-age=86400, immutable',
            ],
        );
    }
}
