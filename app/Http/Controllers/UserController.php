<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function toggleDarkMode()
    {
        /** @var App\Models\User */
        $user = Auth::user();

        $user->update([
            'dark_mode' => ! $user->dark_mode,
        ]);
    }
}
