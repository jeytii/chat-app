<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
    ];

    protected $hidden = [
        'conversation_id',
        'created_at',
        'updated_at',
    ];

    protected $appends = [
        'from_self',
    ];

    public function fromSelf(): Attribute
    {
        return Attribute::get(fn () => (
            Auth::check() ? $this->sender_id === Auth::id() : false
        ));
    }
}
