import { usePage } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import type { EmojiClickData } from 'emoji-picker-react'
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react'
import { Image, SendHorizonal, Smile, X } from 'lucide-react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useContext, useEffect, useRef, useState } from 'react'
import { Remarkable } from 'remarkable'

import { PresenceContext } from '@/components/presence-provider'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppearance } from '@/hooks/use-appearance'
import useAttachment from '@/hooks/use-attachment'
import { getDateDiff, getTimeDiff } from '@/hooks/use-datetime'
import { useThrottle } from '@/hooks/use-limit'
import useMessage from '@/hooks/use-message'
import type { Message } from '@/types/models'

export default function MessageBox() {
    const { chat_id: chatId, auth } = usePage<{ chat_id: number }>().props
    const { image, gif, previewImage, setImage, revokePreviewImage } = useAttachment(null)
    const { onlineIds } = useContext(PresenceContext)
    const [showEmojis, setShowEmojis] = useState<boolean>(false)
    const { insert, alter } = useMessage()
    const textarea = useRef<HTMLTextAreaElement>(null)
    const { appearance } = useAppearance()
    const throttle = useThrottle(1000)
    const channel = window.Echo.join(`room.${chatId}`)

    useEffect(() => {
        return () => {
            revokePreviewImage()
        }
    }, [revokePreviewImage])

    const { mutate, isPending } = useMutation<
        AxiosResponse<Message>,
        Error,
        { content: string; file: File | string | null; seen: boolean },
        { id: number }
    >({
        mutationFn: data => axios.post(`/chats/${chatId}/messages`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Socket-ID': window.Echo.socketId(),
            },
        }),
        async onMutate({ content }, { client }) {
            await client.cancelQueries({ queryKey: ['messages', chatId] })

            const itemId = Math.floor(Math.random() * 1000000000)

            insert(chatId, {
                id: itemId,
                content: new Remarkable({ html: false, breaks: true }).render(content),
                gif: gif,
                image_url: image ? previewImage : null,
                from_self: true,
                date: new Date().toLocaleString(),
                date_diff: 'Today',
                time_diff: 'Now',
                is_fake: true,
            })

            if (textarea.current) {
                textarea.current.value = ''
            }

            return { id: itemId }
        },
        onSuccess({ data }, payload, context) {
            alter(chatId, context.id, {
                ...data,
                date_diff: getDateDiff(data.date),
                time_diff: getTimeDiff(data.date),
                seen: undefined,
                is_fake: undefined,
            })

            revokePreviewImage()
            setImage(null)
        },
        onSettled(data, error, payload, context, { client }) {
            client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })
        },
    })

    function handleMessage() {
        throttle(() => {
            channel.whisper('typing', {})
        })
    }

    function insertEmoji({ emoji }: EmojiClickData) {
        const input = textarea.current as HTMLTextAreaElement
        // 1. Get the current cursor positions
        const start = input.selectionStart
        const end = input.selectionEnd
        const value = input.value

        // 2. Splice the emoji between the text chunks
        input.value = value.substring(0, start) + emoji + value.substring(end)

        // 3. Put focus back onto the textarea
        input.focus()

        // 4. Move the cursor directly after the inserted emoji
        if (start !== value.length) {
            const position = start + emoji.length

            input.selectionStart = position
            input.selectionEnd = position
        }

        setShowEmojis(true)
    }

    function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = (event.target.files as FileList)[0]

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return
        }

        revokePreviewImage()
        setImage(file)
    }

    function removeUpload() {
        revokePreviewImage()
        setImage(null)
    }

    function handleSubmit(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (!event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            textarea.current?.form?.requestSubmit()
        }
    }

    function send(data: FormData) {
        const value = data.get('message')?.toString() || ''

        if (!value.length && !image) {
            return
        }

        mutate({
            content: value,
            file: image,
            seen: onlineIds.length >= 2,
        })
    }

    return (
        <form action={send} className='z-10'>
            <InputGroup className='items-end rounded-none border-x-0 border-b-0 border-border dark:border-input/60 dark:bg-transparent'>
                <InputGroupTextarea
                    ref={textarea}
                    name='message'
                    placeholder='Write a message'
                    className='min-h-auto px-4'
                    onKeyDown={handleSubmit}
                    onChange={handleMessage}
                />
                <InputGroupAddon align='block-end'>
                    <Popover open={showEmojis} onOpenChange={setShowEmojis}>
                        <PopoverTrigger asChild>
                            <InputGroupButton type='button' variant='ghost' size='icon-xs'>
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
                        type='button'
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
                    <InputGroupButton type='button' variant='ghost' size='icon-xs'>
                        <svg viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm4.026 2.879C5.356 7.65 5.72 7.5 6 7.5s.643.15.974.629a.75.75 0 0 0 1.234-.854C7.66 6.484 6.873 6 6 6c-.873 0-1.66.484-2.208 1.275C3.25 8.059 3 9.048 3 10c0 .952.25 1.941.792 2.725C4.34 13.516 5.127 14 6 14c.873 0 1.66-.484 2.208-1.275a.75.75 0 0 0 .133-.427V10a.75.75 0 0 0-.75-.75H6.25a.75.75 0 0 0 0 1.5h.591v1.295c-.293.342-.6.455-.841.455-.279 0-.643-.15-.974-.629C4.69 11.386 4.5 10.711 4.5 10c0-.711.19-1.386.526-1.871ZM10.75 6a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Zm3 0h2.5a.75.75 0 0 1 0 1.5H14.5v1.75h.75a.75.75 0 0 1 0 1.5h-.75v2.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Z' clipRule='evenodd' />
                        </svg>
                    </InputGroupButton>
                    <InputGroupButton
                        variant='ghost'
                        size='icon-xs'
                        className='ml-auto'
                    >
                        <SendHorizonal />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>

            {(!!previewImage && !isPending) && (
                <div className='px-4 pb-4'>
                    <div className='relative inline-block'>
                        <img src={previewImage} className='block max-h-25 max-w-25 rounded' />

                        <Button
                            type='button'
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
        </form>
    )
}
