<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Override;

class Message extends Model
{
    use SoftDeletes;

    #[Override]
    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            $model->secondary_id = uniqid();
            $model->tertiary_id = Str::random(16);
        });

        static::deleted(function (self $model): void {
            if ($image = $model->image) {
                Storage::delete($image);
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Conversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * @return Attribute<string|null, string|null>
     */
    protected function content(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => $value ? Crypt::encryptString($value) : null,
            get: fn (?string $value): ?string => $value ? Crypt::decryptString($value) : null,
        );
    }
}
