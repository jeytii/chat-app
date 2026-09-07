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
        ['name' => $name] = $request->validate([
            'name' => 'required|string',
        ]);

        return User::whereNot('id', $request->user()->id)
            ->whereNotNull('email_verified_at')
            ->where(fn (Builder $query) => (
                $query->whereLike('name', "%{$name}%")
                    ->orWhereLike('username', "%{$name}%")
            ))
            ->limit(20)
            ->get()
            ->toResourceCollection();
    }
}
