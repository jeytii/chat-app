<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;

class Conversation extends Pivot
{
    public $table = 'conversations';
    
    public $incrementing = true;

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invited(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
