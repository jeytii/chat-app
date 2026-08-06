import { usePage } from '@inertiajs/react'
import { useSocketId } from '@laravel/echo-react'
import type { InfiniteData } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import type { EmojiClickData } from 'emoji-picker-react'
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react'
import Echo from 'laravel-echo'
import { Image, SendHorizonal, Smile, X } from 'lucide-react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useContext, useEffect, useRef, useState } from 'react'
import { Remarkable } from 'remarkable'

import { MessageContentContext } from '@/components/message-content-provider'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppearance } from '@/hooks/use-appearance'
import { getDateDiff, getTimeDiff } from '@/hooks/use-datetime'
import { useInsertMessage } from '@/hooks/use-insert-message'
import { useThrottle } from '@/hooks/use-limit'
import type { Message, MessageResponse } from '@/types/models'

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
})

export default function MessageBox() {
    const { conversation_id: conversationId, auth } = usePage<{ conversation_id: number }>().props
    const { message, editId, setMessage, setEditId } = useContext(MessageContentContext)
    const [image, setImage] = useState<File | string | null>(null)
    const [showEmojis, setShowEmojis] = useState<boolean>(false)
    const insertMessage = useInsertMessage()
    const textarea = useRef<HTMLTextAreaElement>(null)
    const { appearance } = useAppearance()
    const previewImage = useRef<string | null>(null)
    const throttle = useThrottle(1000)
    const socketId = useSocketId()
    const channel = echo.private(`conversation.${conversationId}`)
    const queryKey = ['messages', conversationId]

    useEffect(() => {
        return () => {
            if (previewImage.current) {
                URL.revokeObjectURL(previewImage.current)
                previewImage.current = null
            }
        }
    }, [])

    const { mutate: edit } = useMutation<
        AxiosResponse<Message>,
        Error,
        { id: number; content: string; }
    >({
        mutationFn: ({ id, content }) => axios.put(`/messages/${id}`, { content }, {
            headers: {
                'X-Socket-ID': socketId,
            },
        }),
        async onMutate({ id, content }, { client }) {
            await client.cancelQueries({ queryKey })

            client.setQueryData<InfiniteData<MessageResponse>>(queryKey, current => (
                !current ? current : {
                    ...current,
                    pages: current.pages.map(page => ({
                        ...page,
                        items: page.items.map(item => {
                            if (item.id === id) {
                                item.content = new Remarkable({ html: false, breaks: true }).render(content)
                            }

                            return item
                        }),
                    })),
                }
            ))

            setMessage('')
        },
        onSuccess({ data }, { id }, context, { client }) {
            client.setQueryData<InfiniteData<MessageResponse>>(queryKey, current => (
                !current ? current : {
                    ...current,
                    pages: current.pages.map(page => ({
                        ...page,
                        items: page.items.map(item => item.id === id ? data : item),
                    })),
                }
            ))
        },
        async onSettled(data, error, payload, context, { client }) {
            await client.invalidateQueries({
                queryKey,
                refetchType: 'none',
            })

            setEditId(null)
        },
    })

    const { mutate: add } = useMutation<
        AxiosResponse<Message>,
        Error,
        { conversation_id: number; content: string; file: File | string | null; },
        { id: number }
    >({
        mutationFn: data => axios.post('/messages', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Socket-ID': socketId,
            },
        }),
        async onMutate({ content, file }, { client }) {
            await client.cancelQueries({ queryKey })

            const itemId = Math.floor(Math.random() * 1000000000)

            insertMessage(conversationId, {
                id: itemId,
                content: new Remarkable({ html: false, breaks: true }).render(content),
                gif: null,
                image_url: null,
                from_self: true,
                date: new Date().toLocaleString(),
                date_diff: 'Today',
                time_diff: 'Now',
                edited: false,
                is_fake: true,
                has_image: !!file,
            })

            setMessage('')
            setImage(null)

            if (previewImage.current) {
                URL.revokeObjectURL(previewImage.current)
                previewImage.current = null
            }

            return { id: itemId }
        },
        onSuccess({ data }, payload, context, { client }) {
            client.setQueryData<InfiniteData<MessageResponse>>(queryKey, current => {
                if (!current) {
                    return current
                }

                return {
                    ...current,
                    pages: current.pages.map((page, index, pages) => {
                        // If the onMutate() placeholder is found in the 2 latest pages, replace it with the Message model returned by the server.
                        if (index >= pages.length - 2) {
                            return {
                                ...page,
                                items: page.items.map(item => (
                                    item.id !== context.id
                                        ? item
                                        : {
                                            ...data,
                                            date_diff: getDateDiff(data.date),
                                            time_diff: getTimeDiff(data.date),
                                        }
                                )),
                            }
                        }

                        return page
                    }),
                }
            })
        },
        onSettled(data, error, payload, context, { client }) {
            client.invalidateQueries({
                queryKey,
                refetchType: 'none',
            })
        },
    })

    function handleMessage(event: ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value)

        throttle(() => {
            channel.whisper('typing', {
                username: auth.user.username,
            })
        })
    }

    function insertEmoji({ emoji }: EmojiClickData): void {
        const input = textarea.current as HTMLTextAreaElement
        const start = input.selectionStart
        const end = input.selectionEnd

        setMessage(message => {
            if (start === message.length) {
                return message.concat(emoji)
            } else {
                return message.substring(0, start)
                    + emoji
                    + message.substring(end)
            }
        })

        input.focus()

        if (start !== message.length) {
            setTimeout(() => {
                input.selectionStart = start + emoji.length
                input.selectionEnd = start + emoji.length
            })
        }

        setShowEmojis(true)
    }

    function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = (event.target.files as FileList)[0]

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return
        }

        if (previewImage.current?.endsWith('.gif')) {
            URL.revokeObjectURL(previewImage.current)
        }

        setImage(file)
        previewImage.current = URL.createObjectURL(file)
    }

    function removeUpload() {
        setImage(null)
        URL.revokeObjectURL(previewImage.current as string)
        previewImage.current = null
    }

    function handleSubmit(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (!event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            send()
        } else if (event.key === 'Escape' && editId) {
            setEditId(null)
            setMessage('')
        }
    }

    function send() {
        const value = message.trim()

        if (!value.length && !image) {
            return
        }

        if (editId) {
            edit({
                id: editId,
                content: value,
            })
        } else {
            add({
                conversation_id: conversationId,
                content: value,
                file: image,
            })
        }
    }

    return (
        <div className='z-10'>
            <InputGroup className='items-end rounded-none border-x-0 border-b-0 border-border dark:border-input/60 dark:bg-transparent'>
                <InputGroupTextarea
                    ref={textarea}
                    placeholder='Write a message'
                    value={message}
                    className='min-h-auto px-4'
                    onKeyDown={handleSubmit}
                    onChange={handleMessage}
                />
                <InputGroupAddon align='block-end'>
                    <Popover open={showEmojis} onOpenChange={setShowEmojis}>
                        <PopoverTrigger asChild>
                            <InputGroupButton variant='ghost' size='icon-xs'>
                                <Smile />
                            </InputGroupButton>
                        </PopoverTrigger>
                        <PopoverContent align='start' className='w-auto p-2'>
                            <EmojiPicker
                                open={showEmojis}
                                theme={
                                    {
                                        light: Theme.LIGHT,
                                        dark: Theme.DARK,
                                        system: Theme.AUTO,
                                    }[appearance]
                                }
                                emojiStyle={EmojiStyle.GOOGLE}
                                autoFocusSearch={false}
                                previewConfig={{ showPreview: false }}
                                skinTonesDisabled
                                lazyLoadEmojis
                                onEmojiClick={insertEmoji}
                            />
                        </PopoverContent>
                    </Popover>
                    <InputGroupButton
                        variant='ghost'
                        size='icon-xs'
                        asChild
                    >
                        <label>
                            <Image />
                            <input
                                type='file'
                                accept='image/jpeg, image/png, image/webp'
                                className='hidden'
                                onChange={upload}
                            />
                        </label>
                    </InputGroupButton>
                    <InputGroupButton variant='ghost' size='xs'>
                        GIF
                    </InputGroupButton>
                    <InputGroupButton
                        variant='ghost'
                        size='icon-xs'
                        disabled={!message.trim().length && !image}
                        className='ml-auto'
                        onClick={send}
                    >
                        <SendHorizonal />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>

            {!!image && (
                <div className='px-4 pb-4'>
                    <div className='relative inline-block'>
                        {typeof image === 'string' ? (
                            <img src={image} className='block max-h-25 max-w-25 rounded' />
                        ) : (
                            <img src={previewImage.current as string} className='block max-h-25 max-w-25 rounded' />
                        )}

                        <Button
                            variant='outline'
                            size='icon-xs'
                            className='absolute -top-2.5 -right-2.5 bg-background!'
                            onClick={removeUpload}
                        >
                            <X />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
