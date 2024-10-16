<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'profile_photo',
        'dark_mode',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'profile_photo',
        'password',
        'remember_token',
        'created_at',
        'updated_at',
    ];

    protected $appends = [
        'name',
        'profile_photo_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    protected static function booted()
    {
        static::updated(function (self $model) {
            Storage::delete($model->getOriginal('profile_photo'));
        });
    }

    /**
     * =================================
     * Relationships
     * =================================
     */
    public function addedContacts(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'conversations', 'inviter_id', 'invited_id')
            ->withTimestamps();
    }

    public function linkedContacts(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'conversations', 'invited_id', 'inviter_id')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * =================================
     * Custom methods
     * =================================
     */
    public function hasContact(string $username): bool
    {
        return $this->whereRelation('addedContacts', 'username', $username)
            ->orWhereRelation('linkedContacts', 'username', $username)
            ->exists();
    }

    /**
     * =================================
     * Custom attributes
     * =================================
     */
    public function name(): Attribute
    {
        return Attribute::get(fn () => "{$this->first_name} {$this->last_name}");
    }

    public function profilePhotoUrl(): Attribute
    {
        return Attribute::get(function () {
            $image = $this->profile_photo;

            if (! $image) {
                return null;
            }

            if (str_starts_with($image, 'https://robohash.org')) {
                return $image;
            }

            return Storage::url($image);
        });
    }
}
