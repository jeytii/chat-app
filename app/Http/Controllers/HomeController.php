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

        $user->loadCount('chats')
            ->loadCount('sentRequests')
            ->loadCount('receivedRequests');

        return inertia('home', [
            ...$user->only(['chats_count', 'sent_requests_count', 'received_requests_count']),
            'tab' => \in_array($tab, ['received-requests', 'sent-requests']) ? $tab : 'chats',
        ]);
    }
}
