<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->controller(AuthController::class)->group(function () {
    Route::get('login', 'showLoginPage')->name('login.page');
    Route::post('login', 'login')->name('login');
});

Route::middleware('auth')->controller(ChatController::class)->group(function () {
    Route::get('/', 'index')->name('index');
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');