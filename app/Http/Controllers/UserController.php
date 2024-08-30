<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function getContacts()
    {
        $id = Auth::id();
        $users = Conversation::query()
            ->where('inviter_id', $id)
            ->orWhere('invited_id', $id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Conversation $conversation) => (
                $conversation->inviter_id !== $id ? $conversation->inviter : $conversation->invited
            ));

        return compact('users');
    }

    public function addToContacts(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users'],
        ]);

        /** @var User */
        $user = Auth::user();
        $addedUser = User::query()->firstWhere('username', $validated['username']);

        $user->addedContacts()->attach($addedUser);

        return ['user' => $addedUser];
    }

    public function search(Request $request)
    {
        $username = Auth::user()->username;
        $query = $request->get('query');

        $users = User::query()
            ->whereNot('username', $username)
            ->whereDoesntHave('addedContacts', fn (Builder $query): Builder => (
                $query->where('username', $username)
            ))
            ->whereDoesntHave('linkedContacts', fn (Builder $query): Builder => (
                $query->where('username', $username)
            ))
            ->when(
                (bool) $query,
                fn (Builder $builder) => $builder->where(fn (Builder $builder): Builder => (
                    $builder->whereRaw('CONCAT(first_name, last_name) LIKE ?', ["%{$query}%"])
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
