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
        $username = Auth::user()->username;
        $query = $request->get('query');

        $users = User::query()
            ->whereNot('username', $username)
            ->whereDoesntHave('initiatedConversations', fn (Builder $query): Builder => (
                $query->where('username', $username)
            ))
            ->whereDoesntHave('joinedConversations', fn (Builder $query): Builder => (
                $query->where('username', $username)
            ))
            ->when(
                (bool) $query,
                fn (Builder $builder) => $builder->where(fn (Builder $builder): Builder => (
                    $builder->whereRaw('CONCAT(first_name, last_name) RLIKE ?', ["%{$query}%"])
                        ->orWhere('username', 'like', "%{$query}%")
                )),
                fn (Builder $builder): Builder => $builder->limit(10),
            )
            ->orderByRaw('CONCAT(first_name, last_name)')
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
