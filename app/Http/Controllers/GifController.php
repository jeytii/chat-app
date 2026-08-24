<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GifController extends Controller
{
    /**
     * @return array<string, mixed>
     */
    public function __invoke(Request $request): array
    {
        abort_unless($request->wantsJson(), 404);

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
