<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\GifController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('/', 'home')->name('home');

    Route::apiResource('chats', ChatController::class)
        ->only(['index', 'show']);

    Route::controller(MessageController::class)->name('chats.messages')->scopeBindings()->group(function () {
        Route::put('chats/{chat}/messages/{message}/restore', 'restore')
            ->withTrashed()
            ->name('.restore');
        Route::post('chats/{chat}/messages/{message}/react', 'react')
            ->name('.react');
        Route::get('chats/{chat}/image/{message:image}', 'viewImage')
            ->name('.image');
    });
    Route::apiResource('chats.messages', MessageController::class)
        ->except('show')
        ->scoped();

    Route::get('gifs', GifController::class);

    Route::controller(SettingsController::class)->name('settings.')->group(function () {
        Route::inertia('settings', 'settings')
            ->name('index');

        Route::patch('settings/profile', 'updateProfile')
            ->name('profile');

        Route::put('settings/profile-photo', 'updateProfilePhoto')
            ->name('profile-photo');

        Route::put('settings/password', 'updatePassword')
            ->middleware(['verified', 'throttle:6,1'])
            ->name('password');

        // Route::delete('settings/delete-account', 'deleteAccount')
        //     ->middleware('verified')
        //     ->name('delete-account');
    });
});
