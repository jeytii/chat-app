import { useState, useRef, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Image, ImagePlay, SendHorizonal } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import type { Message, User } from '@/types'

export default function MessageBox() {
  const [message, setMessage] = useState<string>('')
  const textarea = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()
  const receiverUsername = queryClient.getQueryData<string>(['username'])
  const { mutate, isPending } = useMutation({
    mutationFn: () => axios.post(
      '/send-message',
      { message },
      {
        params: { username: receiverUsername },
      },
    ),
    onMutate() {
      queryClient.setQueryData(
        ['chat', { username: receiverUsername }],
        ({ user, messages }) => ({
          user: user as User,
          messages: [...messages, {
            id: 0,
            from_self: true,
            content: 'Sending....',
          }],
        })
      )
    },
    onSuccess({ data }) {
      queryClient.setQueryData<{ user: User; messages: Message[]; }>(
        ['chat', { username: receiverUsername }],
        (prev) => {
          if (! prev) {
            return undefined
          }

          const newMessages = prev.messages.filter(m => m.id !== 0)

          return {
            user: prev.user,
            messages: [ ...newMessages, data.message ],
          }
        }
      )

      setMessage('')
      textarea.current?.removeAttribute('style')
    },
    onError() {
      queryClient.setQueryData<{ user: User; messages: Message[]; }>(
        ['chat', { username: receiverUsername }],
        (prev) => {
          if (! prev) {
            return undefined
          }

          return {
            user: prev.user,
            messages: prev.messages.filter(m => m.id !== 0),
          }
        }
      )
    }
  })

  function watchHeight(event: ChangeEvent<HTMLTextAreaElement>) {
    const { target } = event

    if (target.value) {
      target.style.height = 'auto'
      target.style.height = `${target.scrollHeight}px`
    } else {
      target.removeAttribute('style')
    }

    setMessage(target.value)
  }

  function send() {
    if (!message) {
      return
    }

    mutate()
  }

  return (
    <section className='border-t border-border bg-secondary dark:bg-gray-950'>
      <Textarea
        ref={textarea}
        className='min-h-0 resize-none overflow-hidden rounded-none border-0 bg-transparent p-4'
        placeholder='Write a message'
        rows={1}
        value={message}
        onInput={watchHeight}
      />
      <div className='flex'>
        <Button
          className='h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100'
          variant='ghost'
          size='sm'
        >
          <Image size='20' />
        </Button>
        <Button
          className='h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100'
          variant='ghost'
          size='sm'
        >
          <ImagePlay size='20' />
        </Button>
        <Button
          className='ml-auto h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100 disabled:pointer-events-none disabled:opacity-20'
          variant='ghost'
          size='sm'
          disabled={isPending}
          onClick={send}
        >
          <SendHorizonal size='20' />
        </Button>
      </div>
    </section>
  )
}
