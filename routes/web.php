<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'auth.session', 'verified'])->group(function () {
    Route::inertia('/', 'home')->name('home');

    Route::apiResource('chats', ChatController::class)
        ->only(['index', 'show'])
        ->middlewareFor('index', 'json');

    Route::controller(MessageController::class)->name('chats.messages')->scopeBindings()->group(function () {
        Route::put('chats/{chat}/messages/{message}/restore', 'restore')
            ->withTrashed()
            ->name('.restore');
        Route::post('chats/{chat}/messages/{message}/react', 'react')
            ->name('.react');
    });
    Route::apiResource('chats.messages', MessageController::class)
        ->except('show')
        ->scoped()
        ->middlewareFor('index', 'json')
        ->middlewareFor(['store', 'update'], 'limited:attachment-upload,5');

    Route::controller(ImageController::class)->group(function () {
        Route::get('photo/{image}', 'profilePhoto')
            ->name('profile-photo');
        Route::get('attachment/{chat}/{message:image}', 'attachment')
            ->can('viewImage', ['message', 'chat'])
            ->name('attachment');
        Route::get('gifs', 'gifs')
            ->middleware('json');
    });

    Route::controller(NotificationController::class)->group(function () {
        Route::get('notifications', 'index')
            ->middleware('json');
        Route::put('notifications/{id}/read', 'read');
        Route::post('notifications/peek', 'peek');
    });

    Route::controller(SettingsController::class)->name('settings.')->group(function () {
        Route::inertia('settings', 'settings')
            ->name('index');

        Route::patch('settings/profile', 'updateProfile')
            ->name('profile');

        Route::put('settings/profile-photo', 'updateProfilePhoto')
            ->middleware('limited:profile-photo-upload,2')
            ->name('profile-photo');

        Route::put('settings/password', 'updatePassword')
            ->middleware(['verified', 'throttle:6,1'])
            ->name('password');

        // Route::delete('settings/delete-account', 'deleteAccount')
        //     ->middleware('verified')
        //     ->name('delete-account');
    });
});
