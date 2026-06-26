<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('/', 'home')->name('home');

    Route::apiResource('conversations', ConversationController::class)
        ->only(['index', 'show']);

    Route::apiResource('messages', MessageController::class)
        ->only(['index', 'store']);
});

require __DIR__.'/settings.php';
