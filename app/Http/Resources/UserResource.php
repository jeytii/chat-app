<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function __construct(mixed $resource, protected ?int $conversationId = null)
    {
        parent::__construct($resource);
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'conversation_id' => $this->whenNotNull($this->conversationId),
            'name' => $this->name,
            'username' => $this->username,
            'image_url' => $this->image ? Storage::url($this->image) : null,
        ];
    }
}
