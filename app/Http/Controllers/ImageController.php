<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImageController extends Controller
{
    public function __invoke(string $path): StreamedResponse
    {
        $authId = auth()->id();

        abort_unless($authId, 403);

        $message = Message::query()
            ->where('image', 'like', "%{$path}%")
            ->with('conversation')
            ->firstOrFail();

        abort_if(
            $message->conversation->accepter_id !== $authId && $message->conversation->requestor_id !== $authId,
            403,
        );

        return Storage::response(
            $message->image,
            headers: [
                'Cache-Control' => 'private, max-age=86400',
            ]
        );
    }
}
