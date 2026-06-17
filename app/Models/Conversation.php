<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[Table(name: 'conversations', incrementing: true)]
class Conversation extends Pivot
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function requestor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requestor_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function accepter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepter_id');
    }

    /**
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
