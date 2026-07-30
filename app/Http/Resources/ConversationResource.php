<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 * @property int $requestor_id
 * @property int $accepter_id
 */
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
            'has_new_message' => false,
        ];
    }
}
