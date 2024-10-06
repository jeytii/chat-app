<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

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
        'profile_photo_url',
        'dark_mode',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'created_at',
        'updated_at',
    ];

    protected $appends = [
        'name',
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
}
