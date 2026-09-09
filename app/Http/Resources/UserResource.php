<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...$this->only(['id', 'name', 'email', 'username']),
            'request_sent' => $this->whenHas('request_sent'),
            'is_added' => $this->whenHas('is_added'),
            'image_url' => $this->image ? route('profile-photo', explode('/', $this->image)[1]) : null,
        ];
    }
}
