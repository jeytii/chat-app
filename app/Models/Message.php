<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * @property string $id
 * @property string $chat_id
 * @property string $sender_id
 * @property ?string $reference_id
 * @property ?string $content
 * @property ?string $gif
 * @property ?string $image
 * @property ?CarbonImmutable $seen_at
 * @property CarbonImmutable $created_at
 * @property ?CarbonImmutable $updated_at
 * @property ?CarbonImmutable $deleted_at
 */
class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    use HasUuids;
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'encrypted',
        ];
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
     * @return BelongsToMany<User, $this>
     */
    public function reactions(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'reactions', 'message_id', 'user_id')
            ->withPivot(['name', 'emoji']);
    }
}
