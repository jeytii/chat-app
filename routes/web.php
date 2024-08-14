<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->controller(AuthController::class)->group(function () {
    Route::get('login', 'showLoginPage')->name('login.page');
    Route::post('login', 'login')->name('login');
});

Route::middleware('auth')->controller(ChatController::class)->group(function () {
    Route::get('/', 'index')->name('index');
});

Route::put('toggle-dark-mode', [UserController::class, 'toggleDarkMode'])
    ->middleware('auth')
    ->name('toggle-dark-mode');

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');