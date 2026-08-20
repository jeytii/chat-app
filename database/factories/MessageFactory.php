<?php

namespace Database\Factories;

use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Http\UploadedFile;

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

    public function withImage(string $chatId, string $filename = 'image.png'): static
    {
        return $this->state([
            'image' => UploadedFile::fake()
                ->image($filename)
                ->store("chats/{$chatId}"),
        ]);
    }

    public function withGif(): static
    {
        return $this->state([
            'gif' => 'https://tenor.com/7D6cByKD0E.gif',
        ]);
    }
}
