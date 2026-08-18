<?php

namespace App\Http\Resources;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;

/**
 * @mixin Message
 */
class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $content = Str::markdown($this->content, [
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

        return [
            'id' => $this->id,
            'sender' => $this->when($request->boolean('sender_email'), $request->string('sender_email')),
            'reference' => $this->whenLoaded(
                'reference',
                $this->reference
                    ? Arr::only(
                        new self($this->reference)->toArray($request),
                        ['id', 'raw_content', 'image_url', 'gif', 'from_self'],
                    )
                    : null,
            ),
            'raw_content' => $this->content,
            'content' => $content,
            'gif' => $this->gif,
            'image_url' => $this->getImageUrl($this->image),
            'from_self' => $this->unless($request->boolean('sender_email'), $this->sender_id === auth()->id()),
            'reactions' => $this->whenLoaded(
                'reactions',
                $this->reactions->map->only(['name', 'emoji', 'total', 'has_reacted']),
            ),
            'date' => $this->created_at,
            'seen' => $request->boolean('seen', (bool) $this->seen_at),
            'edited' => (bool) $this->updated_at,
            'deleted' => (bool) $this->deleted_at,
        ];
    }

    private function getImageUrl(?string $file): ?string
    {
        if (! $file) {
            return null;
        }

        $path = explode('/', $file);

        return route('chats.messages.image', [
            'chat' => $this->chat_id,
            'message' => end($path),
        ]);
    }
}
