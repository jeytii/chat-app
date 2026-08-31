<?php

namespace App\Http\Controllers;

use App\Events\MessageEvent;
use App\Events\MessageReaction;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;
use App\Jobs\DeleteMessage;
use App\Models\Chat;
use App\Models\Message;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Image;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * @return array<string, JsonResource|string|null>
     */
    #[Authorize('viewAny', [Message::class, 'chat'])]
    public function index(Chat $chat): array
    {
        $messages = $chat->messages()
            ->when(
                /** @phpstan-ignore-next-line */
                $chat->users()->find(auth()->id())->pivot->cleared_at,
                fn (Builder $query, CarbonImmutable $date) => $query->where('created_at', '>', $date)
            )
            ->withTrashed()
            ->latest()
            ->with([
                'reference',
                'reactions' => fn (Relation $query) => (
                    // Group reactions by the unique emoji code
                    $query->select('message_id', 'reactions.name', 'emoji')
                        ->selectRaw('count(reactions.name) as total')
                        ->selectRaw(
                            // Append a custom attribute that determines if the user has already reacted with the current emoji
                            'EXISTS(SELECT 1 FROM reactions WHERE user_id = ? AND message_id = reactions.message_id AND name = reactions.name) AS has_reacted',
                            [auth()->id()],
                        )
                        ->groupBy('reactions.name')
                ),
            ])
            ->cursorPaginate(20);

        return [
            'items' => MessageResource::collection($messages->reverse()),
            'next_cursor' => $messages->nextCursor()?->encode(),
        ];
    }

    #[Authorize('create', [Message::class, 'chat'])]
    public function store(MessageRequest $request, Chat $chat): JsonResource
    {
        $payload = $request->validated();
        $user = $request->user();
        $image = $request->safe()->file('image');

        if ($image) {
            $this->applyAttachmentLimit($user->id);

            $filename = Str::random(40).'.'.$image->extension();

            $payload['image'] = "chats/{$chat->id}/{$filename}";
        }

        $message = $chat->messages()
            ->create([
                ...$payload,
                'sender_id' => $user->id,
                'seen_at' => $request->boolean('seen') ? now() : null,
            ])
            ->toResource();

        if ($image) {
            $path = explode('/', $payload['image']);

            $image->storeAs("chats/{$chat->id}", end($path));
        }

        broadcast(new MessageEvent(
            'MessageSent',
            $chat->id,
            $message->toArray($request->merge(['sender_email' => $user->email])),
        ))->toOthers();

        return $message;
    }

    #[Authorize('update', 'message')]
    public function update(MessageRequest $request, Chat $chat, Message $message): JsonResource
    {
        $payload = $request->validated();

        /** @var UploadedFile|string|null */
        $image = $request->safe()->file('image');

        if ($image) {
            $this->applyAttachmentLimit($request->user()->id);

            $filename = Str::random(40).'.'.$image->extension();

            $payload['image'] = "chats/{$chat->id}/{$filename}";
        }

        $message->update($payload);

        if ($message->wasChanged('image') && $image) {
            $paths = explode('/', $message->image);

            $image->storeAs("chats/{$chat->id}", end($paths));
        }

        if ($message->wasChanged()) {
            broadcast(new MessageEvent(
                'MessageEdited',
                $chat->id,
                $message->load('reference')->toResource()->resource->only([
                    'id', 'reference', 'raw_content',
                    'content', 'image_url', 'gif', 'edited',
                ]),
            ))->toOthers();
        }

        return $message->toResource();
    }

    /**
     * @return array<string, bool>
     */
    #[Authorize('delete', 'message')]
    public function destroy(Chat $chat, Message $message): array
    {
        if ($message->delete()) {
            DeleteMessage::dispatch($message, $chat->id)->delay(5);
        }

        return ['success' => true];
    }

    /**
     * @return array<string, bool>
     */
    #[Authorize('restore', 'message')]
    public function restore(Chat $chat, Message $message): array
    {
        $message->restore();

        return ['success' => true];
    }

    /**
     * @return array<string, bool>
     */
    #[Authorize('react', ['message', 'chat'])]
    public function react(Request $request, Chat $chat, Message $message): array
    {
        $data = $request->validate([
            'name' => 'required|string',
            'emoji' => 'required|string',
        ]);

        $user = $request->user();

        // User can't react with the same emoji twice
        if ($request->boolean('has_reacted')) {
            DB::table('reactions')
                ->where('user_id', $user->id)
                ->where('name', $data['name'])
                ->delete();
        } else {
            $message->reactions()->attachOrFail($user, $data);
        }

        // Broadcast the clicked reaction
        $reaction = $message
            ->load(['reactions' => fn (Relation $query) => (
                $query->select('message_id', 'reactions.name', 'emoji')
                    ->selectRaw('count(reactions.name) as total')
                    ->selectRaw(
                        'EXISTS(SELECT 1 FROM reactions WHERE user_id = ? AND name = ?) AS has_reacted',
                        [$user->id, $data['name']],
                    )
                    ->groupBy('reactions.name')
                    ->where('reactions.name', $data['name'])
            )])
            ->reactions
            ->first()
            ?->only(['name', 'emoji', 'total', 'has_reacted']);

        $broadcastData = $reaction ?? [
            ...$data,
            'total' => 0,
            'has_reacted' => false,
        ];

        broadcast(new MessageReaction($chat->id, $message->id, $broadcastData))->toOthers();

        return ['success' => true];
    }

    #[Authorize('viewImage', ['message', 'chat'])]
    public function viewImage(Request $request, Chat $chat, Message $message): Response
    {
        return Image::fromStorage($message->image)
            ->toResponse($request)
            ->header('Cache-Control', 'private, max-age=86400, immutable');
    }

    private function applyAttachmentLimit(string $userId): void
    {
        $canProceed = RateLimiter::attempt(
            "can-attach-image:{$userId}",
            5,
            fn () => null,
            60 * 60 * 5, // 5 hours
        );

        if (! $canProceed) {
            inertia()->flash('toast', [
                'type' => 'success',
                'message' => __('You can only attach a standard image 3 times every 3 hours.'),
            ]);

            abort(429);
        }
    }
}
