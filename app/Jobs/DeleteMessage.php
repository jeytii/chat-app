<?php

namespace App\Jobs;

use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Storage;

class DeleteMessage implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Message $message,
        protected string $chatId,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->message->trashed()) {
            $image = $this->message->image;

            $this->message->update([
                'reference_id' => null,
                'content' => null,
                'image' => null,
                'gif' => null,
            ]);

            if ($image) {
                Storage::delete($image);
            }

            Broadcast::private("chat.{$this->chatId}")
                ->as('MessageDeleted')
                ->with([
                    'chat_id' => $this->chatId,
                    'id' => $this->message->id,
                ])
                ->toOthers()
                ->sendNow();

            Broadcast::presence("room.{$this->chatId}")
                ->as('MessageDeleted')
                ->with($this->message->only('id'))
                ->toOthers()
                ->sendNow();
        }
    }
}
