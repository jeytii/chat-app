<?php

namespace App\Http\Resources;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;
use League\CommonMark\Extension\ExternalLink\ExternalLinkExtension;

/**
 * @property int $id
 * @property int $sender_id
 * @property ?string $content
 * @property ?string $gif
 * @property ?string $image
 * @property CarbonImmutable $created_at
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
            'reference' => $this->whenLoaded('reference'),
            'raw_content' => $this->content,
            'content' => $content,
            'gif' => $this->gif,
            'image_url' => $this->getImageUrl($this->image),
            'from_self' => $this->sender_id === auth()->id(),
            'date' => $this->created_at,
        ];
    }

    private function getImageUrl(?string $file): ?string
    {
        if (! $file) {
            return null;
        }

        $path = explode('/', $file);

        return route('image', end($path));
    }
}
