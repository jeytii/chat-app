<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConnectionRequest;
use App\Models\Chat;
use App\Models\User;
use App\Notifications\RequestAccepted;
use App\Notifications\RequestSent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Pusher\ApiErrorException;

class RequestController extends Controller
{
    public function getSent(Request $request): ResourceCollection
    {
        return $request->user()
            ->sentRequests()
            ->orderByPivotDesc('created_at')
            ->get()
            ->toResourceCollection();
    }

    public function getReceived(Request $request): ResourceCollection
    {
        return $request->user()
            ->receivedRequests()
            ->orderByPivotDesc('created_at')
            ->get()
            ->toResourceCollection();
    }

    /**
     * @return array<string, bool>
     */
    public function add(ConnectionRequest $request, User $user): array
    {
        /** @var User */
        $authUser = $request->user();

        $authUser->sentRequests()->attach($user);

        $user->notify(new RequestSent($authUser));

        return ['success' => true];
    }

    /**
     * @return array<string, string|JsonResource|bool>
     */
    public function accept(ConnectionRequest $request, User $user): array
    {
        /** @var User */
        $authUser = $request->user();

        $chat = DB::transaction(function () use ($authUser, $user): Chat {
            $authUser->receivedRequests()->detach($user);

            $chat = $authUser->chats()->create();

            $chat->users()->attach($user);

            $user->notify(new RequestAccepted($chat, $authUser));

            return $chat;
        });

        $isOnline = false;

        try {
            $presence = Broadcast::driver('reverb')->getPusher()->get('/channels/presence-online/users');

            $isOnline = (bool) Arr::where(
                $presence->users,
                fn (object $data) => $data->id === $user->id,
            );
        } catch (ApiErrorException $e) {
            $isOnline = false;
        }

        return [
            'id' => $chat->id,
            'user' => $user->toResource(),
            'is_online' => $isOnline,
        ];
    }

    /**
     * @return array<string, bool>
     */
    public function decline(Request $request, User $user): array
    {
        $request->user()->receivedRequests()->detach($user);

        return ['success' => true];
    }

    /**
     * @return array<string, bool>
     */
    public function cancel(Request $request, User $user): array
    {
        $request->user()->sentRequests()->detach($user);

        return ['success' => true];
    }
}
