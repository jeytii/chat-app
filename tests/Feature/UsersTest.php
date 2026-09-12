<?php

use App\Models\User;
use App\Notifications\RequestAccepted;
use App\Notifications\RequestSent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;

beforeEach(function () {
    Notification::fake();

    $this->user = User::factory()->create();
    $this->anotherUser = User::factory()->create();
});

afterEach(function () {
    Cache::flush();
});

test('can handle spamming of the users.request route', function () {
    $http = actingAs($this->user);

    // Simulate a user spamming the endpoint within 3 seconds.
    foreach (range(1, 5) as $counter) {
        $lock = cache()->lock("request-connection:{$this->anotherUser->id}:{$this->user->id}", 3);

        if ($counter > 1) {
            $lock->get();
        }

        $response = $http->post(route('users.request', $this->anotherUser));

        if ($counter > 1) {
            $response->assertStatus(403);
        } else {
            $response->assertStatus(200);
        }

        $lock->release();
    }

    // Make another call after the lock has been released.
    // Should be prevented by the policy.
    $http->post(route('users.request', $this->anotherUser))
        ->assertStatus(403);

    Notification::assertSentToTimes($this->anotherUser, RequestSent::class, 1);

    assertDatabaseCount('requests', 1);
});

test('can handle spamming of the users.accept route', function () {
    $this->user->receivedRequests()->attach($this->anotherUser);

    $http = actingAs($this->user);

    // Simulate a user spamming the endpoint within 3 seconds.
    foreach (range(1, 5) as $counter) {
        $lock = cache()->lock("accept-request:{$this->anotherUser->id}:{$this->user->id}", 3);

        if ($counter > 1) {
            $lock->get();
        }

        $response = $http->post(route('users.accept', $this->anotherUser));

        if ($counter > 1) {
            $response->assertStatus(403);
        } else {
            $response->assertStatus(200);
        }

        $lock->release();
    }

    // Make another call after the lock has been released.
    // Should be prevented by the policy.
    $http->post(route('users.accept', $this->anotherUser))
        ->assertStatus(403);

    Notification::assertSentToTimes($this->anotherUser, RequestAccepted::class, 1);

    assertDatabaseCount('requests', 0);
    assertDatabaseCount('chats', 1);
});
