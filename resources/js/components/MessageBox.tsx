import { useContext, useRef, type ChangeEvent } from 'react'
import { usePage } from '@inertiajs/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse, AxiosError } from 'axios'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { marked } from 'marked'
import { Image, ImagePlay, SendHorizonal, Smile } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ChatPanelContext } from './ChatPanel'
import { useOnChangeDebounce } from '@/hooks/debounce'
import useUpdateMessages from '@/hooks/message'
import { useTheme } from './ThemeProvider'
import type { PageProps } from '@inertiajs/core'
import type { Message, User } from '@/types'

export default function MessageBox() {
  const { user: authUser } = usePage<{ user: User; } & PageProps>().props
  const textarea = useRef<HTMLTextAreaElement>(null)
  const messages = useContext(ChatPanelContext)
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const receiver = queryClient.getQueryData<User>(['current-chat'])
  const updateMessages = useUpdateMessages(receiver?.username as string)

  const { mutate } = useMutation<AxiosResponse<{ message: Message; }>, AxiosError, string, number>({
    mutationFn: (message) => axios.post(
      '/send-message',
      { message },
      {
        params: { username: receiver?.username },
      },
    ),
    onMutate(message) {
      const messageId = Math.floor(Math.random() * 1000000000)

      updateMessages((messages) => ([
        ...messages,
        {
          id: messageId,
          from_self: true,
          loading: true,
          content: marked.parseInline(message, { breaks: true }).toString(),
        },
      ]))

      if (textarea.current) {
        textarea.current.removeAttribute('style')
        textarea.current.value = ''
      }

      setTimeout(() => {
        messages?.current?.scrollTo({ top: messages.current.scrollHeight })
      }, 0)

      return messageId
    },
    onSuccess({ data }, message, messageId) {
      updateMessages((messages) => (
        messages.map((message) => message.id === messageId ? data.message : message)
      ))
    },
    onError(error, message, messageId) {
      updateMessages((messages) => {
        if (error.status === 422) {
          return messages.filter((message) => message.id !== messageId)
        }

        return messages.map((message) => (
          message.id === messageId
            ? { ...message, is_not_sent: true }
            : message
        ))
      })
    }
  })

  const debounceNotifyTyping = useOnChangeDebounce(
    () => {
      if (receiver) {
        window.Echo.private(`chat.${receiver.username}`).whisper('typing', {
          username: authUser.username,
          typing: false,
        })
      }
    },
    (event) => {
      if (receiver && event.target.value) {
        window.Echo.private(`chat.${receiver.username}`).whisper('typing', {
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

  function selectEmoji({ emoji }: EmojiClickData) {
    if (textarea.current) {
      textarea.current.value += emoji
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
    <section className='sticky bottom-0 left-0 border-t border-border bg-secondary dark:bg-gray-950'>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className='h-auto px-4 py-2 text-accent-foreground opacity-60 hover:bg-transparent hover:opacity-100'
              variant='ghost'
              size='sm'
            >
              <Smile />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='p-0'>
            <EmojiPicker
              lazyLoadEmojis={true}
              autoFocusSearch={false}
              skinTonesDisabled={true}
              previewConfig={{ showPreview: false }}
              theme={Theme[theme === 'dark' ? 'DARK' : 'LIGHT']}
              onEmojiClick={selectEmoji}
            />
          </PopoverContent>
        </Popover>
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
