<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseMissing;

test('settings page is displayed', function () {
    actingAs(User::factory()->create())
        ->get(route('settings.index'))
        ->assertOk();
});

test('profile information can be updated and user is still verified', function () {
    $user = User::factory()->create();
    $oldData = $user->only(['name', 'username']);
    $newName = 'Test User';
    $newUsername = 'testuser';

    actingAs($user)
        ->patch(route('settings.profile'), [
            'name' => $newName,
            'username' => $newUsername,
        ])
        ->assertRedirectBackWithoutErrors();

    assertDatabaseMissing('users', $oldData);

    expect($user->name)->toBe($newName);
    expect($user->username)->toBe($newUsername);
    expect($user->hasVerifiedEmail())->toBeTrue();
});

test('password can be updated', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->put(route('settings.password'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirectBackWithoutErrors();

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('correct password must be provided to update password', function () {
    actingAs(User::factory()->create())
        ->put(route('settings.password'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirectBackWithErrors(['current_password']);
});

// test('email verification status is unchanged when the email address is unchanged', function () {
//     $user = User::factory()->create([
//         'username' => 'testuser',
//     ]);

//     $response = $this
//         ->actingAs($user)
//         ->patch(route('profile.update'), [
//             'name' => 'Test User',
//             'email' => $user->email,
//             'username' => $user->username,
//         ]);

//     $response
//         ->assertSessionHasNoErrors()
//         ->assertRedirect(route('profile.edit'));

//     expect($user->refresh()->email_verified_at)->not->toBeNull();
// });

// test('user can delete their account', function () {
//     $user = User::factory()->create();

//     $response = $this
//         ->actingAs($user)
//         ->delete(route('profile.destroy'), [
//             'password' => 'password',
//         ]);

//     $response
//         ->assertSessionHasNoErrors()
//         ->assertRedirect(route('home'));

//     $this->assertGuest();
//     expect($user->fresh())->toBeNull();
// });

// test('correct password must be provided to delete account', function () {
//     $user = User::factory()->create();

//     $response = $this
//         ->actingAs($user)
//         ->from(route('profile.edit'))
//         ->delete(route('profile.destroy'), [
//             'password' => 'wrong-password',
//         ]);

//     $response
//         ->assertSessionHasErrors('password')
//         ->assertRedirect(route('profile.edit'));

//     expect($user->fresh())->not->toBeNull();
// });

// test('security page is displayed', function () {
//     Features::twoFactorAuthentication([
//         'confirm' => true,
//         'confirmPassword' => true,
//     ]);

//     $user = User::factory()->create();

//     $this->actingAs($user)
//         ->withSession(['auth.password_confirmed_at' => time()])
//         ->get(route('security.edit'))
//         ->assertInertia(

//             fn (Assert $page) => $page
//                 ->component('settings/security')
//                 ->where('canManageTwoFactor', true)
//                 ->where('twoFactorEnabled', false),
//         );
// });

// test('security page requires password confirmation when enabled', function () {
//     $user = User::factory()->create();

//     Features::twoFactorAuthentication([
//         'confirm' => true,
//         'confirmPassword' => true,
//     ]);

//     $response = $this->actingAs($user)
//         ->get(route('security.edit'));

//     $response->assertRedirect(route('password.confirm'));
// });

// test('security page does not require password confirmation when disabled', function () {
//     $user = User::factory()->create();

//     Features::twoFactorAuthentication([
//         'confirm' => true,
//         'confirmPassword' => false,
//     ]);

//     $this->actingAs($user)
//         ->get(route('security.edit'))
//         ->assertOk()
//         ->assertInertia(

//             fn (Assert $page) => $page
//                 ->component('settings/security'),
//         );
// });

// test('security page renders without two factor when feature is disabled', function () {
//     config(['fortify.features' => []]);

//     $user = User::factory()->create();

//     $this->actingAs($user)
//         ->get(route('security.edit'))
//         ->assertOk()
//         ->assertInertia(

//             fn (Assert $page) => $page
//                 ->component('settings/security')
//                 ->where('canManageTwoFactor', false)
//                 ->missing('twoFactorEnabled')
//                 ->missing('requiresConfirmation'),
//         );
// });
