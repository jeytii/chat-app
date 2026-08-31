<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Image;

class ImageController extends Controller
{
    public function profilePhoto(Request $request, string $filename): Response
    {
        return Image::fromStorage("profile_photos/{$filename}")
            ->toResponse($request)
            ->header('Cache-Control', 'max-age=86400, immutable');
    }

    public function attachment(Request $request, Chat $chat, Message $message): Response
    {
        return Image::fromStorage($message->image)
            ->toResponse($request)
            ->header('Cache-Control', 'private, max-age=86400, immutable');
    }

    /**
     * @return array<string, mixed>
     */
    public function gifs(Request $request): array
    {
        $query = $request->query('q');
        $cacheKey = $query ?? 'trending';

        // TODO: Removing caching step in production
        return cache()->rememberForever("gifs:{$cacheKey}", function () use ($query): array {
            $appKey = config('services.klipy.app_key');
            $api = $query ? 'search' : 'trending';
            $response = Http::get("https://api.klipy.com/api/v1/{$appKey}/gifs/{$api}", [
                'q' => $query,
                'per_page' => 30,
                'format_filter' => 'gif',
                'content_filter' => 'off',
            ])->json()['data'];

            return array_map(fn (array $gif) => [
                'id' => $gif['id'],
                'title' => $gif['title'],
                'md' => data_get($gif, 'file.md.gif.url'),
                'sm' => data_get($gif, 'file.sm.gif.url'),
            ], $response['data']);
        });
    }
}
