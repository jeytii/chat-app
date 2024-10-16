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
    Route::get('/', [ChatController::class, 'index'])->name('index');
    Route::get('get-messages', [ChatController::class, 'getMessages'])->name('get-messages');
    Route::post('send-message', [ChatController::class, 'sendMessage'])->name('send-message');
    Route::put('messages/mark-as-read', [ChatController::class, 'markMessagesAsRead'])->name('messages.mark-as-read');

    Route::controller(UserController::class)->group(function () {
        Route::post('users/contacts/{user:username}/add', 'addToContacts')->name('users.contacts.add');
        Route::delete('users/contacts/{user:username}/remove', 'removeFromContacts')->name('users.contacts.remove');
        Route::get('users/search', 'search')->name('users.search');
        Route::post('users/update', 'update')->name('users.update');
        Route::put('toggle-dark-mode', 'toggleDarkMode')->name('toggle-dark-mode');
    });

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});
