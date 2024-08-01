<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLoginPage()
    {
        return inertia('Login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($data, true)) {
            $request->session()->regenerate();

            return to_route('index');
        }

        return back()->withErrors([
            'username' => 'User not found.'
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logoutCurrentDevice();

        $request->session()->invalidate();

        $request->session()->regenerate();

        return to_route('login.page');
    }
}