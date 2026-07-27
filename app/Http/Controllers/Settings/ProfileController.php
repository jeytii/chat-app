<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Image\Image;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        /** @var User */
        $user = $request->user();
        $data = $request->validated();

        if ($data['email'] !== $user->email) {
            $data['email_verified_at'] = null;
        }

        $user->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    public function changeProfilePhoto(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,png,webp'],
            'crop' => ['required', 'array'],
            'crop.width' => ['required', 'numeric'],
            'crop.height' => ['required', 'numeric'],
            'crop.x' => ['required', 'numeric'],
            'crop.y' => ['required', 'numeric'],
        ]);

        /** @var User */
        $user = $request->user();
        $dir = "profile_photos/{$user->id}";
        $filename = Str::random(40).'.webp';

        if ($user->update(['image' => "{$dir}/{$filename}"])) {
            $image = $request->image('image');

            $width = ($image->width() * $data['crop']['width']) / 100;
            $height = ($image->height() * $data['crop']['height']) / 100;
            $x = ($image->width() * $data['crop']['x']) / 100;
            $y = ($image->height() * $data['crop']['y']) / 100;

            $image->crop($width, $height, $x, $y)
                ->when(
                    fn (Image $img) => $img->mimeType() !== 'image/webp',
                    fn (Image $img) => $img->toWebp(),
                )
                ->storeAs($dir, $filename, 'public');

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile picture updated.')]);
        }

        return back();
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
