<?php

use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', HomeController::class)->name('home');
});

require __DIR__.'/settings.php';
