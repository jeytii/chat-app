<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $id = $request->integer('id');

        if ($id) {
            return inertia('conversation', [
                'conversationId' => $id,
            ]);
        }

        return inertia('home');
    }
}
