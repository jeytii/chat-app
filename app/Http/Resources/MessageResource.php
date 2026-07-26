<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->whenLoaded('reference'),
            'content' => $this->content,
            'gif' => $this->gif,
            'image_url' => $this->getImageUrl($this->image),
            'from_self' => $this->sender_id === auth()->id(),
            'date' => $this->created_at->format('Y-m-d'),
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
