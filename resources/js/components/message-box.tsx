import { usePage } from '@inertiajs/react'
import { useSocketId } from '@laravel/echo-react'
import { useMessageScroller } from '@shadcn/react/message-scroller'
import type { InfiniteData } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import type { EmojiClickData } from 'emoji-picker-react'
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react'
import { Image, SendHorizonal, Smile, X } from 'lucide-react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Remarkable } from 'remarkable'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppearance } from '@/hooks/use-appearance'
import { useInsertMessage } from '@/hooks/use-insert-message'
import { useThrottle } from '@/hooks/use-limit'
import usePrivateChannel from '@/hooks/use-private-channel'
import { toReadableDate } from '@/lib/utils'
import type { Message, MessageResponse } from '@/types/models'

export default function MessageBox() {
    const { conversation_id: conversationId, auth } = usePage<{ conversation_id: number }>().props
    const [message, setMessage] = useState<string>('')
    const [image, setImage] = useState<File | string | null>(null)
    const [showEmojis, setShowEmojis] = useState<boolean>(false)
    const queryClient = useQueryClient()
    const insertMessage = useInsertMessage()
    const textarea = useRef<HTMLTextAreaElement>(null)
    const { scrollToEnd } = useMessageScroller()
    const { appearance } = useAppearance()
    const previewImage = useRef<string | null>(null)
    const indicateTyping = useThrottle(1000)
    const socketId = useSocketId()
    const channel = usePrivateChannel(`conversation.${conversationId}`)
    const queryKey = ['messages', conversationId]


    useEffect(() => {
        return () => {
            setMessage('')
            setImage(null)
            setShowEmojis(false)

            if (previewImage.current) {
                URL.revokeObjectURL(previewImage.current)
                previewImage.current = null
            }
        }
    }, [])

    const { mutate } = useMutation<
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
        async onMutate({ content, file }) {
            await queryClient.cancelQueries({ queryKey })

            const itemId = Math.floor(Math.random() * 1000000000)

            insertMessage(conversationId, {
                id: itemId,
                content: new Remarkable({ html: false, breaks: true }).render(content),
                gif: null,
                image_url: null,
                from_self: true,
                date: toReadableDate(new Date(), '2-digit'),
                is_fake: true,
                has_image: !!file,
            })

            setTimeout(() => {
                scrollToEnd({
                    behavior: 'instant',
                })
            }, 0)

            setMessage('')
            setImage(null)

            if (previewImage.current) {
                URL.revokeObjectURL(previewImage.current)
                previewImage.current = null
            }

            return { id: itemId }
        },
        onSuccess({ data }, payload, context) {
            queryClient.setQueryData<InfiniteData<MessageResponse>>(queryKey, current => {
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
                                items: page.items.map(page => page.id === context.id ? data : page),
                            }
                        }

                        return page
                    }),
                }
            })
        },
        onSettled() {
            queryClient.invalidateQueries({
                queryKey,
                refetchType: 'none',
            })
        },
    })

    function handleMessage(event: ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value)

        indicateTyping(() => {
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
        }
    }

    function send() {
        const value = message.trim()

        if (!value.length && !image) {
            return
        }

        mutate({
            conversation_id: conversationId,
            content: value,
            file: image,
        })
    }

    return (
        <div className='z-10'>
            <InputGroup className='items-end rounded-none border-x-0 border-b-0 dark:bg-transparent'>
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
