<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::controller(ProfileController::class)->name('profile.')->group(function () {
        Route::get('settings/profile', 'edit')
            ->name('edit');

        Route::patch('settings/profile', 'update')
            ->name('update');

        Route::patch('settings/change-profile-photo', 'changeProfilePhoto')
            ->name('change-profile-photo');

        Route::delete('settings/profile', 'destroy')
            ->middleware('verified')
            ->name('destroy');
    });

    Route::middleware(['verified'])->controller(SecurityController::class)->group(function () {
        Route::get('settings/security', 'edit')
            ->name('security.edit');

        Route::put('settings/password', 'update')
            ->middleware('throttle:6,1')
            ->name('user-password.update');
    });
});
