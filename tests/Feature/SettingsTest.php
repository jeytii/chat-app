<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Image;
use Illuminate\Support\Facades\Storage;

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

test('cannot update profile photo if the dimensions are smaller than 200x200', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->put(route('settings.profile-photo'), [
            'image' => UploadedFile::fake()->image('image.jpg', 100, 100),
            'crop' => [
                'width' => 100,
                'height' => 100,
                'x' => 0,
                'y' => 0,
            ],
        ])
        ->assertRedirectBackWithErrors(['image']);

    expect($user->refresh()->image)->toBeNull();
});

test('cannot update profile photo if the format is not JPG/PNG/WEBP', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->put(route('settings.profile-photo'), [
            'image' => UploadedFile::fake()->image('image.gif', 200, 200),
            'crop' => [
                'width' => 100,
                'height' => 100,
                'x' => 0,
                'y' => 0,
            ],
        ])
        ->assertRedirectBackWithErrors(['image']);

    expect($user->refresh()->image)->toBeNull();
});

test('can update profile photo', function () {
    Storage::fake();

    $user = User::factory()->create();
    $originalWidth = 1280;
    $originalHeight = 720;
    $cropWidth = 20;
    $cropHeight = 20;
    $file = UploadedFile::fake()->image('image.jpg', $originalWidth, $originalHeight);

    actingAs($user)
        ->put(route('settings.profile-photo'), [
            'image' => $file,
            'crop' => [
                'width' => $cropWidth,
                'height' => $cropHeight,
                'x' => 400,
                'y' => 100,
            ],
        ])
        ->assertRedirectBackWithoutErrors();

    $path = $user->refresh()->image;

    expect(is_null($path))->toBeFalse();

    Storage::assertExists($path);

    $image = Image::fromStorage($path);

    expect($image->width())->toBe(($originalWidth * $cropWidth) / 100); // Must be {$cropWidth}% of $originalWidth
    expect($image->height())->toBe(($originalHeight * $cropHeight) / 100); // Must be {$cropHeight}% of $originalHeight
    expect($image->mimeType())->toBe('image/webp');
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
