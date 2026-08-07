<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('/', 'home')->name('home');

    Route::apiResource('conversations', ConversationController::class)
        ->only(['index', 'show']);

    Route::apiResource('messages', MessageController::class)
        ->except('show');

    Route::get('image/{path}', ImageController::class)->name('image');

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
