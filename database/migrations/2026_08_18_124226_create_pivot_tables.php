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
        Schema::create('chat_user', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('chat_id')->constrained();
            $table->foreignUuid('user_id')->constrained();
            $table->boolean('hidden')->default(false);
            $table->timestamp('cleared_at')->nullable();
            $table->timestamps();
        });

        Schema::create('requests', function (Blueprint $table) {
            $table->foreignUuid('sender_id')->constrained('users');
            $table->foreignUuid('receiver_id')->constrained('users');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('reactions', function (Blueprint $table) {
            $table->foreignUuid('message_id')->constrained();
            $table->foreignUuid('user_id')->constrained();
            $table->string('name');
            $table->string('emoji');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_user');
        Schema::dropIfExists('requests');
        Schema::dropIfExists('reactions');
    }
};
