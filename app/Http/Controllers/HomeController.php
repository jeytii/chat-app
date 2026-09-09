<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User */
        $user = $request->user();
        $tab = $request->query('tab');

        return inertia('home', [
            'tab' => \in_array($tab, ['received-requests', 'sent-requests']) ? $tab : 'chats',
            'chatsCount' => $user->chats()->count(),
            'receivedRequestsCount' => $user->receivedRequests()->count(),
            'sentRequestsCount' => $user->sentRequests()->count(),
        ]);
    }
}
