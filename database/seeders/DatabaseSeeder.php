<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $first = User::factory()->create([
            'name' => 'Test User',
            'username' => 'testuser',
        ]);

        $second = User::factory()->create([
            'name' => 'Dummy User',
            'username' => 'dummyuser',
        ]);

        $third = User::factory()->create();

        User::factory(7)->create();

        $first->chats()->create()->users()->attach($second);
        $first->chats()->create()->users()->attach($third);
    }
}
