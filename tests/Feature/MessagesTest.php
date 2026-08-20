<?php

use App\Events\MessageEvent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->otherUser = User::factory()->create();
    $this->chat = $this->user->chats()->create();

    $this->chat->users()->attach($this->otherUser);
});

test('can correctly fetch paginated messages', function () {
    Message::factory(30)
        ->for($this->chat)
        ->for($this->user, 'sender')
        ->state(new Sequence(
            fn (Sequence $sequence) => ['created_at' => now()->addMinutes($sequence->index + 1)],
        ))
        ->create();

    // First fetch
    $firstFetch = actingAs($this->user)
        ->get(route('chats.messages.index', $this->chat))
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
    $secondFetch = actingAs($this->user)
        ->get(route('chats.messages.index', [
            'chat' => $this->chat,
            'cursor' => $firstFetchNextCursor,
        ]))
        ->assertOk()
        ->assertJsonCount(10, 'items');

    expect($secondFetch->json('next_cursor'))->toBeNull();
});

describe('CREATE', function () {
    beforeEach(function () {
        Event::fake();
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

    test('cannot send a message with an attachment that is not JPEG/PNG/WEBP', function (string $image) {
        actingAs($this->user)
            ->postJson(route('chats.messages.store', $this->chat), [
                'image' => UploadedFile::fake()->image($image),
            ])
            ->assertStatus(422)
            ->assertOnlyJsonValidationErrors('image');
    })->with([
        'image.gif',
        'vector.svg',
        'file.pdf',
    ]);

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

describe('UPDATE', function () {
    beforeEach(function () {
        Event::fake();
        Storage::fake();
    });

    test('can update a message', function () {
        $message = Message::factory()
            ->for($this->chat)
            ->for($this->user, 'sender')
            ->withImage($this->chat->id)
            ->create();

        $currentContent = $message->content;
        $currentImage = $message->image;

        actingAs($this->user)
            ->putJson(
                route('chats.messages.update', [
                    'chat' => $this->chat,
                    'message' => $message,
                ]),
                [
                    'content' => 'hey there',
                    'image' => UploadedFile::fake()->image('upload.webp'),
                ],
            )
            ->assertStatus(200)
            ->assertJsonMissingValidationErrors(['content', 'image', 'gif']);

        $message = $message->refresh();

        expect($message->content)->not()->toBe($currentContent);
        expect($message->image)->not()->toBe($currentImage);

        Storage::assertExists($message->image);

        Event::assertDispatched(
            MessageEvent::class,
            fn (MessageEvent $event) => $event->eventName === 'MessageEdited',
        );
    });

    test('uploaded image nullifies gif attribute', function () {
        $message = Message::factory()
            ->for($this->chat)
            ->for($this->user, 'sender')
            ->withGif()
            ->create();

        actingAs($this->user)
            ->putJson(
                route('chats.messages.update', [
                    'chat' => $this->chat,
                    'message' => $message,
                ]),
                [
                    'image' => UploadedFile::fake()->image('upload.webp'),
                    'gif' => null,
                ],
            )
            ->assertStatus(200)
            ->assertJsonMissingValidationErrors(['content', 'image', 'gif']);

        $message = $message->refresh();

        expect($message->gif)->toBeNull();
        expect($message->image)->not()->toBeNull();

        Storage::assertExists($message->image);

        Event::assertDispatched(
            MessageEvent::class,
            fn (MessageEvent $event) => $event->eventName === 'MessageEdited',
        );
    });

    test('selected gif nullifies image attribute', function () {
        $message = Message::factory()
            ->for($this->chat)
            ->for($this->user, 'sender')
            ->withImage($this->chat->id)
            ->create();

        actingAs($this->user)
            ->putJson(
                route('chats.messages.update', [
                    'chat' => $this->chat,
                    'message' => $message,
                ]),
                [
                    'gif' => 'https://tenor.com/7D6cByKD0E.gif',
                    'image' => null,
                ],
            )
            ->assertStatus(200)
            ->assertJsonMissingValidationErrors(['content', 'image', 'gif']);

        $message = $message->refresh();

        expect($message->image)->toBeNull();
        expect($message->gif)->not()->toBeNull();

        Event::assertDispatched(
            MessageEvent::class,
            fn (MessageEvent $event) => $event->eventName === 'MessageEdited',
        );
    });

    test('nothing happens if the referenced message and submitted image are the same as their current values', function () {
        $reference = Message::factory()
            ->for($this->chat)
            ->for($this->otherUser, 'sender')
            ->create();

        $message = Message::factory()
            ->for($this->chat)
            ->for($this->user, 'sender')
            ->for($reference, 'reference')
            ->withImage($this->chat->id)
            ->create();

        $currentContent = $message->content;
        $currentImage = $message->image;

        actingAs($this->user)
            ->putJson(
                route('chats.messages.update', [
                    'chat' => $this->chat,
                    'message' => $message,
                ]),
                [
                    'reference_id' => $reference->id,
                    'content' => $message->content,
                    'image' => $currentImage,
                ],
            )
            ->assertStatus(200)
            ->assertJsonMissingValidationErrors(['content', 'image', 'gif']);

        $message = $message->refresh();

        expect($message->reference_id)->toBe($reference->id);
        expect($message->image)->toBe($currentImage);
        expect($message->content)->toBe($currentContent);

        Event::assertNotDispatched(MessageEvent::class);
    });
});
