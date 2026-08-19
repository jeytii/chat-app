<?php

namespace Database\Factories;

use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'content' => fake()->sentence(),
        ];
    }

    public function withImage(string $chatId): static
    {
        return $this->state([
            'image' => fake()->image("chats/{$chatId}", fullPath: false),
        ]);
    }

    public function withGif(): static
    {
        return $this->state([
            'gif' => 'https://tenor.com/7D6cByKD0E.gif',
        ]);
    }
}
