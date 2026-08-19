<?php

use App\Events\MessageEvent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

test('can correctly fetch paginated messages', function () {
    $user = User::factory()->create();
    $chat = $user->chats()->create();

    $chat->users()->attach(User::factory()->create());

    Message::factory(30)
        ->for($chat)
        ->for($user, 'sender')
        ->state(new Sequence(
            fn (Sequence $sequence) => ['created_at' => now()->addMinutes($sequence->index + 1)],
        ))
        ->create();

    // First fetch
    $firstFetch = actingAs($user)
        ->get(route('chats.messages.index', $chat))
        ->assertOk()
        ->assertJsonCount(20, 'items')
        ->assertJsonStructure([
            'items' => [
                '*' => [
                    'raw_content', 'content', 'image_url', 'gif',
                    'from_self', 'date', 'seen', 'edited', 'deleted',
                ],
            ],
            'next_cursor',
        ]);

    $firstFetchNextCursor = $firstFetch->json('next_cursor');

    expect($firstFetchNextCursor)->not()->toBeNull();

    // Second fetch
    $secondFetch = actingAs($user)
        ->get(route('chats.messages.index', [
            'chat' => $chat,
            'cursor' => $firstFetchNextCursor,
        ]))
        ->assertOk()
        ->assertJsonCount(10, 'items');

    expect($secondFetch->json('next_cursor'))->toBeNull();
});

describe('CREATE', function () {
    beforeEach(function () {
        Event::fake();

        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->chat = $this->user->chats()->create();

        $this->chat->users()->attach($this->otherUser);
    });

    test('can send a message', function () {
        actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat), [
                'content' => 'hello',
            ])
            ->assertStatus(201)
            ->assertJsonMissingValidationErrors(['content', 'image', 'gif']);

        Event::assertDispatched(
            MessageEvent::class,
            fn (MessageEvent $event) => $event->eventName === 'MessageSent',
        );
    });

    test('can send a message with an attachment only', function () {
        Storage::fake();

        actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat), [
                'image' => UploadedFile::fake()->image('image.png'),
            ])
            ->assertStatus(201)
            ->assertJsonMissingValidationErrors(['content', 'image', 'gif']);

        Event::assertDispatched(
            MessageEvent::class,
            fn (MessageEvent $event) => $event->eventName === 'MessageSent',
        );
    });

    test('can send a message with both text content and an attachment', function () {
        Storage::fake();

        $http = actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat), [
                'content' => 'hello',
                'image' => UploadedFile::fake()->image('image.png'),
            ])
            ->assertStatus(201)
            ->assertJsonMissingValidationErrors(['content', 'image', 'gif']);

        Storage::assertExists(Message::find($http['id'])->image);

        Event::assertDispatched(
            MessageEvent::class,
            fn (MessageEvent $event) => $event->eventName === 'MessageSent',
        );
    });

    test('can reply to a message', function () {
        $message = Message::factory()
            ->for($this->chat)
            ->for($this->otherUser, 'sender')
            ->create();

        actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat), [
                'reference_id' => $message->id,
                'content' => 'hello',
            ])
            ->assertStatus(201)
            ->assertJsonMissingValidationErrors(['reference_id', 'content', 'image', 'gif']);

        Event::assertDispatched(
            MessageEvent::class,
            fn (MessageEvent $event) => $event->eventName === 'MessageSent',
        );
    });

    test('cannot send a message without text content or attachment', function () {
        actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat))
            ->assertStatus(422)
            ->assertOnlyJsonValidationErrors(['content', 'image', 'gif']);
    });

    test('cannot send a message with both a static image and a GIF', function () {
        actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat), [
                'image' => UploadedFile::fake()->image('image.png'),
                'gif' => 'https://tenor.com/7D6cByKD0E.gif',
            ])
            ->assertStatus(422)
            ->assertOnlyJsonValidationErrors(['image', 'gif']);
    });

    test('cannot reply to a message outside of the current chat', function () {
        $otherUser = User::factory()->create();
        $otherChat = $this->user->chats()->create();

        $otherChat->users()->attach($otherUser);

        $message = Message::factory()
            ->for($otherChat)
            ->for($otherUser, 'sender')
            ->create();

        actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat), [
                'reference_id' => $message->id,
                'content' => 'hello',
            ])
            ->assertStatus(422)
            ->assertOnlyJsonValidationErrors('reference_id');
    });
});
