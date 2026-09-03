<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\DatabaseNotificationCollection;

class NotificationController extends Controller
{
    /**
     * @return array<string, DatabaseNotificationCollection<string, DatabaseNotification>|string|null>
     */
    public function index(Request $request): array
    {
        $notifications = $request->user()->notifications()->cursorPaginate(10);

        return [
            'items' => $notifications->select(['id', 'data', 'read_at']),
            'next_cursor' => $notifications->nextCursor()?->encode(),
        ];
    }

    /**
     * @return array<string, bool>
     */
    public function read(Request $request): array
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return ['success' => true];
    }
}
