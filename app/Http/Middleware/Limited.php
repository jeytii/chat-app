<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class Limited
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $name, int $maxAttempts): Response
    {
        $key = "{$name}:{$request->user()->id}";

        match ($name) {
            'attachment-upload' => $this->attachmentUploadLimit($request->hasFile('image'), $key, $maxAttempts),
            'profile-photo-upload' => $this->applyLimit($key, $maxAttempts),
            default => null,
        };

        return $next($request);
    }

    private function attachmentUploadLimit(bool $hasImage, string $key, int $maxAttempts): void
    {
        if ($hasImage) {
            $this->applyLimit($key, $maxAttempts);
        }
    }

    private function applyLimit(string $key, int $maxAttempts): void
    {
        $name = explode(':', $key)[0];

        abort_if(
            RateLimiter::tooManyAttempts($key, $maxAttempts),
            429,
            __(match ($name) {
                'attachment-upload' => "You can only upload an attachment {$maxAttempts} times a day.",
                'profile-photo-upload' => "You can only change your profile picture {$maxAttempts} times a day.",
                default => null,
            }),
        );

        $decay = now()->endOfDay() |> now()->diffInSeconds(...) |> round(...);

        RateLimiter::increment($key, (int) $decay);
    }
}
