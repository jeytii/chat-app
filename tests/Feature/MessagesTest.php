<?php

use App\Events\MessageEvent;
use App\Models\Message;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Broadcasting\AnonymousEvent;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\CallQueuedClosure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\travelTo;
use function Spatie\PestPluginTestTime\testTime;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->otherUser = User::factory()->create();
    $this->chat = $this->user->chats()->create();

    $this->chat->users()->attach($this->otherUser);
});

afterAll(function () {
    Cache::clear();
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
        ->assertStatus(200)
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
        ->assertStatus(200)
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

    test('can only upload an attachment 5 times a day', function () {
        Storage::fake();

        $http = actingAs($this->user);
        $currentDateTime = Carbon::parse('today 7pm');
        $tonight = testTime()->freeze($currentDateTime);

        collect(range(1, 5))->each(function ($counter) use ($http, $tonight) {
            if ($counter !== 1) {
                $tonight->addHour();
            }

            // 7pm, 8pm, 9pm, 10pm, and 11pm
            $http->postJson(route('chats.messages.store', $this->chat), [
                'image' => UploadedFile::fake()->image('image.png'),
            ])->assertStatus(201);
        });

        $tonight->addMinutes(10);

        // 11:10pm
        $http->postJson(route('chats.messages.store', $this->chat), [
            'image' => UploadedFile::fake()->image('image.png'),
        ])->assertStatus(429);

        $nextDay = testTime()->freeze($currentDateTime->tomorrow());

        collect(range(1, 5))->each(function ($counter) use ($http, $nextDay) {
            if (in_array($counter, [2, 3])) {
                $nextDay->addHour();
            }

            if ($counter >= 4) {
                $nextDay->addHours(3);
            }

            // Next day 12am, 1am, 2am, 5am, and 8am
            $http->postJson(route('chats.messages.store', $this->chat), [
                'image' => UploadedFile::fake()->image('image.png'),
            ])->assertStatus(201);
        });

        $nextDay->addHour();

        // Next day 9am
        $http->postJson(route('chats.messages.store', $this->chat), [
            'image' => UploadedFile::fake()->image('image.png'),
        ])->assertStatus(429);

        $nextDay->setTime(23, 55);

        // Next day 11:55pm
        $http->postJson(route('chats.messages.store', $this->chat), [
            'image' => UploadedFile::fake()->image('image.png'),
        ])->assertStatus(429);
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

    test('can attach a standard image to a message only 5 times every 5 hours', function () {
        Storage::fake();

        $message = Message::factory()
            ->for($this->chat)
            ->for($this->user, 'sender')
            ->withImage($this->chat->id)
            ->create();

        $http = actingAs($this->user);
        $currentDateTime = Carbon::parse('today 7pm');
        $tonight = testTime()->freeze($currentDateTime);
        $url = route('chats.messages.update', [
            'chat' => $this->chat,
            'message' => $message,
        ]);

        collect(range(1, 5))->each(function ($counter) use ($http, $tonight, $url) {
            if ($counter !== 1) {
                $tonight->addHour();
            }

            // 7pm, 8pm, 9pm, 10pm, and 11pm
            $http->putJson($url, [
                'image' => UploadedFile::fake()->image('image.png'),
            ])->assertStatus(200);
        });

        $tonight->addMinutes(10);

        // 11:10pm
        $http->putJson($url, [
            'image' => UploadedFile::fake()->image('image.png'),
        ])->assertStatus(429);

        $http->putJson($url, [
            'content' => 'Lorem ipsum',
        ])->assertStatus(200);

        $nextDay = testTime()->freeze($currentDateTime->tomorrow());

        collect(range(1, 5))->each(function ($counter) use ($http, $url, $nextDay) {
            if (in_array($counter, [2, 3])) {
                $nextDay->addHour();
            }

            if ($counter >= 4) {
                $nextDay->addHours(3);
            }

            // Next day 12am, 1am, 2am, 5am, and 8am
            $http->putJson($url, [
                'image' => UploadedFile::fake()->image('image.png'),
            ])->assertStatus(200);
        });

        $nextDay->addHour();

        // Next day 9am
        $http->putJson($url, [
            'image' => UploadedFile::fake()->image('image.png'),
        ])->assertStatus(429);

        $http->putJson($url, [
            'content' => 'Hello world',
        ])->assertStatus(200);

        $nextDay->setTime(23, 55);

        // Next day 11:55pm
        $http->putJson($url, [
            'image' => UploadedFile::fake()->image('image.png'),
        ])->assertStatus(429);

        $http->putJson($url, [
            'content' => 'Hello world',
        ])->assertStatus(200);
    });
});

describe('DELETE', function () {
    beforeEach(function () {
        Queue::fake();
        Event::fake();
        Storage::fake();

        $this->message = Message::factory()
            ->for($this->chat)
            ->for($this->user, 'sender')
            ->create();
    });

    test('can delete a message with 5-second grace period to undo action', function () {
        actingAs($this->user)
            ->deleteJson(route('chats.messages.destroy', [
                'chat' => $this->chat,
                'message' => $this->message,
            ]))
            ->assertStatus(200);

        expect($this->message->refresh()->trashed())->toBeTrue();
        expect($this->message->content)->not()->toBeNull();

        Event::assertNotDispatched(MessageEvent::class);

        Queue::assertClosurePushed(function (CallQueuedClosure $job) {
            $job->handle(app());

            return $job->delay === 5;
        });

        travelTo(now()->addSeconds(5));

        Event::assertDispatchedTimes(AnonymousEvent::class, 2);

        Event::assertDispatched(AnonymousEvent::class, fn (AnonymousEvent $event) => $event->broadcastAs() === 'MessageDeleted');

        expect($this->message->refresh()->content)->toBeNull();
    });

    test('can undo message deletion within 5 seconds', function () {
        actingAs($this->user)
            ->deleteJson(route('chats.messages.destroy', [
                'chat' => $this->chat,
                'message' => $this->message,
            ]))
            ->assertStatus(200);

        travelTo(now()->addSeconds(3));

        actingAs($this->user)
            ->putJson(route('chats.messages.restore', [
                'chat' => $this->chat,
                'message' => $this->message,
            ]))
            ->assertStatus(200);

        travelTo(now()->addSeconds(5));

        Event::assertNotDispatched(AnonymousEvent::class);

        expect($this->message->refresh()->trashed())->toBeFalse();
        expect($this->message->content)->not->toBeNull();
    });

    test('cannot undo message deletion if >= 5 seconds have passed', function () {
        actingAs($this->user)
            ->deleteJson(route('chats.messages.destroy', [
                'chat' => $this->chat,
                'message' => $this->message,
            ]))
            ->assertStatus(200);

        Queue::assertClosurePushed(function (CallQueuedClosure $job) {
            $job->handle(app());

            return $job->delay === 5;
        });

        travelTo(now()->addSeconds(6));

        Event::assertDispatchedTimes(AnonymousEvent::class, 2);

        Event::assertDispatched(AnonymousEvent::class, fn (AnonymousEvent $event) => $event->broadcastAs() === 'MessageDeleted');

        actingAs($this->user)
            ->putJson(route('chats.messages.restore', [
                'chat' => $this->chat,
                'message' => $this->message,
            ]))
            ->assertStatus(403);

        $message = $this->message->refresh();

        expect($message->trashed())->toBeTrue();
        expect($message->content)->toBeNull();
    });
});
