<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_user', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('chat_id')->constrained();
            $table->foreignUuid('user_id')->constrained();
            $table->boolean('hidden')->default(false);
            $table->timestamp('cleared_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
