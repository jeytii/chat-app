<?php

namespace App\Http\Controllers;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Validation\Rule;

class MessageController extends Controller
{
    /**
     * @return array<string, JsonResource|string|null>
     */
    public function index(Request $request): array
    {
        $request->validate([
            'conversation_id' => ['bail', 'required', 'integer', 'exists:conversations,id'],
        ]);

        $messages = Message::query()
            ->where('conversation_id', $request->integer('conversation_id'))
            ->withTrashed()
            ->latest()
            ->with('reference')
            ->cursorPaginate(20);

        return [
            'items' => MessageResource::collection($messages->reverse()),
            'next_cursor' => $messages->nextCursor()?->encode(),
        ];
    }

    public function store(Request $request): JsonResource
    {
        $data = $request->validate([
            'conversation_id' => ['bail', 'required', 'integer', 'exists:conversations,id'],
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

        $conversationId = $data['conversation_id'];
        $file = data_get($data, 'file');

        if ($file instanceof UploadedFile) {
            $data['image'] = $file->store("conversations/{$conversationId}");
        }

        if (\is_string($file)) {
            $data['gif'] = $file;
        }

        $message = auth()->user()
            ->messages()
            ->create(
                Arr::only($data, ['conversation_id', 'content', 'image', 'gif']),
            )
            ->toResource();

        Broadcast::private("conversation.{$conversationId}")
            ->as('MessageSent')
            ->with([
                'event' => 'MessageSent',
                'message' => $message->toArray($request),
            ])
            ->toOthers()
            ->send();

        return $message;
    }

    public function update(Request $request, Message $message): JsonResource
    {
        $data = $request->validate([
            'content' => ['required', 'string'],
        ]);

        if ($message->update(['content' => $data['content']])) {
            Broadcast::private("conversation.{$message->conversation_id}")
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
    public function destroy(Message $message): array
    {
        if ($message->delete()) {
            Broadcast::private("conversation.{$message->conversation_id}")
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
}
