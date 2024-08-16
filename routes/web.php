<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->controller(AuthController::class)->group(function () {
    Route::inertia('login', 'Login')->name('login.page');
    Route::post('login', 'login')->name('login');
});

Route::middleware('auth')->group(function () {
    Route::controller(ChatController::class)->group(function () {
        Route::get('/', 'index')->name('index');
    });
    
    Route::controller(UserController::class)->group(function () {
        Route::get('users/search', 'search')->name('users.search');
        Route::put('toggle-dark-mode', 'toggleDarkMode')->name('toggle-dark-mode');
    });
    
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});