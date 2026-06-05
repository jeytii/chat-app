<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('authenticated users cannot visit the login page', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('login'));

    $response->assertRedirectToRoute('home');
});
