<?php

namespace App\Providers;

use Illuminate\Auth\EloquentUserProvider;

class CachedUserProvider extends EloquentUserProvider
{
    public function retrieveById($identifier)
    {
        return cache()->remember(
            "auth-user:{$identifier}",
            now()->addHour(),
            fn () => parent::retrieveById($identifier),
        );
    }
}
