<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', HomeController::class)->name('home');
    Route::get('conversations', [ConversationController::class, 'index']);
});

require __DIR__.'/settings.php';
