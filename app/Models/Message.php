<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $chat_id
 * @property int $sender_id
 * @property ?string $content
 * @property ?string $gif
 * @property ?string $image
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable|null $updated_at
 * @property CarbonImmutable|null $deleted_at
 */
class Message extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            $model->updated_at = null;
        });

        static::softDeleted(function (self $model): void {
            $image = $model->image;

            $model->update([
                'reference_id' => null,
                'content' => null,
                'image' => null,
                'gif' => null,
            ]);

            if ($image) {
                Storage::delete($image);
            }
        });
    }

    public function resolveRouteBindingQuery($query, $value, $field = null)
    {
        return $query->when(
            $field === 'image',
            fn (Builder $query) => $query->where($field, 'like', "%{$value}%"),
            fn (Builder $query) => $query->where($field ?? $this->getRouteKeyName(), $value),
        );
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Chat, $this>
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
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
