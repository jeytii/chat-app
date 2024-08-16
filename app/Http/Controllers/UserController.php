<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->get('query');

        $users = User::query()
            ->whereNot('id', Auth::id())
            ->where(fn (Builder $builder) => (
                $builder->where('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('username', 'like', "%{$query}%")
            ))
            ->get();

        return compact('users');
    }

    public function toggleDarkMode()
    {
        /** @var App\Models\User */
        $user = Auth::user();

        $user->update([
            'dark_mode' => ! $user->dark_mode,
        ]);
    }
}
