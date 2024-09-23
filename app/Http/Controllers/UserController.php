<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function addToContacts(User $user)
    {
        /** @var App\Models\User */
        $authUser = Auth::user();

        $authUser->addedContacts()->attach($user);

        return compact('user');
    }

    public function removeFromContacts(User $user)
    {
        /** @var User */
        $authUser = Auth::user();

        $authUser->addedContacts()->detach($user);
        $authUser->linkedContacts()->detach($user);

        return compact('user');
    }

    public function search(Request $request)
    {
        $username = Auth::user()->username;
        $searchQuery = $request->query('query');

        $users = User::query()
            ->whereNot('username', $username)
            ->whereDoesntHave('addedContacts', fn (Builder $query): Builder => (
                $query->where('username', $username)
            ))
            ->whereDoesntHave('linkedContacts', fn (Builder $query): Builder => (
                $query->where('username', $username)
            ))
            ->when(
                (bool) $searchQuery,
                fn (Builder $query) => (
                    $query->where(fn (Builder $builder): Builder => (
                        $builder->whereRaw("first_name || ' ' || last_name LIKE ?", ["%{$searchQuery}%"])
                            ->orWhere('username', 'like', "%{$searchQuery}%")
                    ))
                ),
                fn (Builder $query) => $query->limit(10),
            )
            ->orderByRaw('first_name || last_name')
            ->get();

        return compact('users');
    }

    public function toggleDarkMode(Request $request)
    {
        /** @var App\Models\User */
        $user = Auth::user();

        $user->update($request->only('dark_mode'));
    }
}
