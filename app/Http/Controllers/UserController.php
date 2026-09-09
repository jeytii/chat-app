<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserController extends Controller
{
    public function __invoke(Request $request): ResourceCollection
    {
        $userId = $request->user()->id;
        $name = $request->string('name')->value();

        return User::whereNot('id', $userId)
            ->whereNotNull('email_verified_at')
            ->when($name, fn (Builder $query) => (
                $query->where(fn (Builder $query) => (
                    $query->whereLike('name', "%{$name}%")->orWhereLike('username', "%{$name}%")
                ))
            ))
            ->limit(20)
            ->unless($name, fn (Builder $query) => $query->inRandomOrder())
            ->withExists([
                'receivedRequests as request_sent' => fn (Builder $query) => $query->where('id', $userId),
                'chats as is_added' => fn (Builder $query) => $query->whereRelation('users', 'users.id', $userId),
            ])
            ->get()
            ->toResourceCollection();
    }
}
