<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    public function __invoke(Message $message)
    {
        abort_if($message->sender_id !== auth()->id(), 403);

        $path = Storage::path($message->image);

        return response()->file($path, [
            'Content-Type' => Storage::mimeType($path),
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
