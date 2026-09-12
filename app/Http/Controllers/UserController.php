<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\Chat;
use App\Models\User;
use App\Notifications\RequestAccepted;
use App\Notifications\RequestSent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Pusher\ApiErrorException;

class UserController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        $userId = $request->user()->id;
        $name = $request->string('name')->value();

        return User::whereNot('id', $userId)
            ->whereNotNull('email_verified_at')
            ->when($name, fn (Builder $query) => (
                $query->where(fn (Builder $query) => (
                    $query->whereLike('name', "%{$name}%")->orWhereLike('username', "%{$name}%")
                ))
            ))
            ->limit(20)
            ->unless($name, fn (Builder $query) => $query->inRandomOrder())
            ->withExists([
                'receivedRequests as request_sent' => fn (Builder $query) => $query->where('id', $userId),
                'chats as is_added' => fn (Builder $query) => $query->whereRelation('users', 'users.id', $userId),
            ])
            ->get()
            ->toResourceCollection();
    }

    public function getSentRequests(Request $request): ResourceCollection
    {
        return $request->user()
            ->sentRequests()
            ->orderByPivotDesc('created_at')
            ->get()
            ->toResourceCollection();
    }

    public function getReceivedRequests(Request $request): ResourceCollection
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
    public function sendRequest(UserRequest $request, User $user): array
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
    public function acceptRequest(UserRequest $request, User $user): array
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

        if (config('app.env') !== 'testing') {
            try {
                $presence = Broadcast::driver('reverb')->getPusher()->get('/channels/presence-online/users');

                $isOnline = (bool) Arr::where(
                    $presence->users,
                    fn (object $data) => $data->id === $user->id,
                );
            } catch (ApiErrorException $e) {
                $isOnline = false;
            }
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
    public function declineRequest(Request $request, User $user): array
    {
        $request->user()->receivedRequests()->detach($user);

        return ['success' => true];
    }

    /**
     * @return array<string, bool>
     */
    public function cancelRequest(Request $request, User $user): array
    {
        $request->user()->sentRequests()->detach($user);

        return ['success' => true];
    }
}
