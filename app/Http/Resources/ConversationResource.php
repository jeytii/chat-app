<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
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
            'user' => $this->requestor_id !== $request->user()->id
                ? new UserResource($this->whenLoaded('requestor'))
                : new UserResource($this->whenLoaded('accepter')),
        ];
    }
}
