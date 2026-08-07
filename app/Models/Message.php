<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class Message extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            $model->updated_at = null;
        });

        static::deleting(function (self $model): void {
            $model->reference_id = null;
            $model->content = null;
            $model->gif = null;
        });

        static::deleted(function (self $model): void {
            if ($image = $model->image) {
                Storage::delete($image);

                $model->image = null;
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
     * @return BelongsTo<self, $this>
     */
    public function reference(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reference_id');
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
