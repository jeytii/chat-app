<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property string $id
 * @property string $name
 * @property string $username
 * @property string $email
 * @property ?string $image
 * @property ?string $gif
 * @property ?CarbonImmutable $email_verified_at
 */
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    use HasUuids;
    use Notifiable;
    use TwoFactorAuthenticatable;

    protected static function booted()
    {
        static::updated(function (self $model): void {
            cache()->forget("auth-user:{$model->id}");

            if ($model->wasChanged('image') && $model->getOriginal('image')) {
                Storage::delete($model->getOriginal('image'));
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsToMany<Chat, $this>
     */
    public function chats(): BelongsToMany
    {
        return $this->belongsToMany(Chat::class)
            ->withPivot(['hidden', 'cleared_at'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * @return BelongsToMany<Message, $this>
     */
    public function reactions(): BelongsToMany
    {
        return $this->belongsToMany(Message::class, 'reactions', 'user_id', 'message_id')
            ->withPivot(['name', 'emoji']);
    }

    /**
     * @return BelongsToMany<self, $this>
     */
    public function sentRequests(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'requests', 'sender_id', 'receiver_id')
            ->withPivot('created_at');
    }

    /**
     * @return BelongsToMany<self, $this>
     */
    public function receivedRequests(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'requests', 'receiver_id', 'sender_id')
            ->withPivot('created_at');
    }
}
