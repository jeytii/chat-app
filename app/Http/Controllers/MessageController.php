<?php

namespace App\Http\Controllers;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;

class MessageController extends Controller
{
    public function index(Request $request): JsonResource
    {
        $request->validate([
            'conversation_id' => ['bail', 'required', 'integer', 'exists:conversations,id'],
        ]);

        $messages = Message::query()
            ->where('conversation_id', $request->integer('conversation_id'))
            ->latest()
            ->with('reference')
            ->paginate(20)
            ->reverse();

        return MessageResource::collection($messages);
    }

    /**
     * @return array<string, JsonResource>
     */
    public function store(Request $request): array
    {
        $data = $request->validate([
            'conversation_id' => ['bail', 'required', 'integer', 'exists:conversations,id'],
            'message' => ['required', 'string'],
        ]);

        $content = Str::markdown($data['message'], [
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

        $message = auth()->user()->messages()->create([
            'conversation_id' => $data['conversation_id'],
            'content' => $content,
        ]);

        return [
            'message' => $message->toResource(),
        ];
    }
}
