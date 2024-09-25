import { useRef, type ChangeEvent } from 'react'
import { usePage } from '@inertiajs/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import { marked } from 'marked'
import { Image, ImagePlay, SendHorizonal } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { useOnChangeDebounce } from '@/hooks'
import type { PageProps } from '@inertiajs/core'
import type { Message, User } from '@/types'

export default function MessageBox() {
  const { user: authUser } = usePage<{ user: User; } & PageProps>().props
  const textarea = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()
  const receiver = queryClient.getQueryData<User>(['current-chat'])
  const { mutate } = useMutation<AxiosResponse<{ message: Message; }>, Error, string, number>({
    mutationFn: (message) => axios.post(
      '/send-message',
      { message },
      {
        params: { username: receiver?.username },
      },
    ),
    onMutate(message) {
      const messageId = Math.floor(Math.random() * 1000000000)
      queryClient.setQueryData<Message[]>(
        ['messages', { username: receiver?.username }],
        (prev) => {
          if (!prev) {
            return undefined
          }

          return [
            ...prev,
            {
              id: messageId,
              from_self: true,
              loading: true,
              content: marked.parseInline(message, { breaks: true }).toString(),
            }
          ]
        }
      )

      if (textarea.current) {
        textarea.current.removeAttribute('style')
        textarea.current.value = ''
      }

      return messageId
    },
    onSuccess({ data }, message, messageId) {
      queryClient.setQueryData<Message[]>(
        ['messages', { username: receiver?.username }],
        (prev) => {
          if (! prev) {
            return undefined
          }

          return [
            ...prev.filter(m => m.id !== messageId),
            data.message,
          ]
        }
      )
    },
    onError(error, message, messageId) {
      queryClient.setQueryData<Message[]>(
        ['messages', { username: receiver?.username }],
        (prev) => prev?.filter(m => m.id !== messageId)
      )
    }
  })

  const debounceNotifyTyping = useOnChangeDebounce(
    () => {
      window.Echo.private('chat').whisper('typing', {
        username: authUser.username,
        typing: false,
      })
    },
    (event) => {
      if (event.target.value) {
        window.Echo.private('chat').whisper('typing', {
          username: authUser.username,
          typing: true,
        })
      }
    },
    1000
  )

  function watchHeight(event: ChangeEvent<HTMLTextAreaElement>) {
    const { target } = event

    if (target.value) {
      target.style.height = 'auto'
      target.style.height = `${target.scrollHeight}px`
    } else {
      target.removeAttribute('style')
    }
  }

  function send() {
    const message = textarea.current?.value

    if (!message) {
      return
    }

    mutate(message)
  }

  return (
    <section className='border-t border-border bg-secondary dark:bg-gray-950'>
      <Textarea
        ref={textarea}
        className='min-h-0 resize-none overflow-hidden rounded-none border-0 bg-transparent p-4'
        placeholder='Write a message'
        rows={1}
        onInput={watchHeight}
        onChange={debounceNotifyTyping}
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
          className='ml-auto h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100'
          variant='ghost'
          size='sm'
          onClick={send}
        >
          <SendHorizonal size='20' />
        </Button>
      </div>
    </section>
  )
}
