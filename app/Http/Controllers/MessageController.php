<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;

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

        $data['raw_content'] = $data['content'];
        $data['content'] = Str::markdown($data['content'], [
            'html_input' => 'escape',
            'allow_unsafe_links' => false,
            'renderer' => [
                'soft_break' => "<br />\n",
            ],
            'external_link' => [
                'internal_hosts' => 'http://localhost:8000',
                'open_in_new_window' => true,
                'html_class' => 'underline',
            ],
        ], [
            new ExternalLinkExtension,
        ]);

        $message = auth()->user()
            ->messages()
            ->create(
                Arr::only($data, ['conversation_id', 'content', 'raw_content', 'image', 'gif']),
            )
            ->toResource();

        broadcast(new MessageSent($conversationId, $message->toArray($request)))->toOthers();

        return $message;
    }
}
