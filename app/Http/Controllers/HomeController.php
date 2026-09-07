<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $tab = $request->query('tab');

        return inertia('home', [
            'tab' => \in_array($tab, ['received-requests', 'sent-requests']) ? $tab : 'chats',
        ]);
    }
}
