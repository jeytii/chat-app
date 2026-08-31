<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Image\Image;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    use PasswordValidationRules, ProfileValidationRules;

    // public function index(Request $request): Response
    // {
    //     return inertia('settings/profile', [
    //         'mustVerifyEmail' => $request->user()->hasVerifiedEmail(),
    //         'status' => $request->session()->get('status'),
    //     ]);
    // }

    public function updateProfile(Request $request): RedirectResponse
    {
        $data = $request->validate($this->profileRules($request->user()->id));

        $request->user()->update($data);

        inertia()->flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return back();
    }

    public function updateProfilePhoto(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,png,webp',
                Rule::dimensions()
                    ->minWidth(200)
                    ->minHeight(200),
            ],
            'crop' => ['required', 'array'],
            'crop.width' => ['required', 'numeric'],
            'crop.height' => ['required', 'numeric'],
            'crop.x' => ['required', 'numeric'],
            'crop.y' => ['required', 'numeric'],
        ]);

        $image = $request->image('image');
        $width = ($image->width() * $data['crop']['width']) / 100;
        $height = ($image->height() * $data['crop']['height']) / 100;
        $x = ($image->width() * $data['crop']['x']) / 100;
        $y = ($image->height() * $data['crop']['y']) / 100;

        $filename = $image->crop($width, $height, $x, $y)
            ->when(
                fn (Image $img) => $img->mimeType() !== 'image/webp',
                fn (Image $img) => $img->toWebp(),
            )
            ->store('profile_photos');

        if ($filename) {
            $request->user()->update(['image' => $filename]);
        }

        inertia()->flash('toast', ['type' => 'success', 'message' => __('Profile picture updated.')]);

        return back();
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => $this->currentPasswordRules(),
            'password' => $this->passwordRules(),
        ]);

        $request->user()->update([
            'password' => $data['password'],
        ]);

        inertia()->flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }

    // public function deleteAccount(Request $request): RedirectResponse
    // {
    //     $request->validate($this->currentPasswordRules());

    //     $user = $request->user();

    //     Auth::logout();

    //     $user->delete();

    //     $request->session()->invalidate();
    //     $request->session()->regenerateToken();

    //     return inertia()->location('/login');
    // }
}
