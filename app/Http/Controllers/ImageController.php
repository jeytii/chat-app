<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImageController extends Controller
{
    public function __invoke(string $path): StreamedResponse
    {
        $message = Message::query()
            ->where('image', 'like', "%{$path}%")
            ->with('conversation')
            ->firstOrFail();

        $authId = auth()->id();

        abort_if(
            $message->conversation->accepter_id !== $authId && $message->conversation->requestor_id !== $authId,
            403,
        );

        return Storage::response(
            $message->image,
            headers: [
                'Cache-Control' => 'public, max-age=86400',
            ]
        );
    }
}
