<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $avatarId = fake()->regexify('[A-Za-z0-9]{19}');
        $avatarSet = fake()->randomElement(['set1', 'set2', 'set3', 'set4']);

        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'username' => str_replace('.', '_', fake()->unique()->userName()),
            'profile_photo' => "https://robohash.org/{$avatarId}?set={$avatarSet}",
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }
}
