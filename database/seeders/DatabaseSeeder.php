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

        User::factory()->create([
            'name' => 'Dummy User',
            'username' => 'dummyuser',
        ]);

        User::factory(8)->create();

        $first->belongsToMany(User::class, 'chats', 'requestor_id', 'accepter_id')->attach([2, 3]);
    }
}
