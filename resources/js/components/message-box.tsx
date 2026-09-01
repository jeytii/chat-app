import { usePage } from '@inertiajs/react'
import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosError, type AxiosResponse } from 'axios'
import EmojiPicker, { type EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react'
import { Image, SendHorizonal, Smile, X } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type RefObject, type SubmitEvent, useEffect, useMemo, useRef } from 'react'
import { Remarkable } from 'remarkable'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'

import GifPicker from '@/components/gif-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppearance } from '@/hooks/use-appearance'
import { getDateDiff, getTimeDiff } from '@/hooks/use-datetime'
import { useThrottle } from '@/hooks/use-limit'
import useMessage from '@/hooks/use-message'
import useStore from '@/hooks/useStore'
import { cn } from '@/lib/utils'
import type { Message, MessageResponse } from '@/types/models'

type CreationPayload = {
    reference_id: string | null;
    content: string | null;
    image: File | string | null;
    gif: string | null;
    seen: boolean;
}

type CreationContext = {
    id: string;
    fakeImage: string | null;
}

type UpdatePayload = {
    id: string;
    reference_id: string | null;
    content: string | null;
    image: File | string | null;
    gif: string | null;
}

export default function MessageBox({ onlineIds }: { onlineIds: RefObject<string[]> }) {
    const { chat_id: chatId } = usePage<{ chat_id: string }>().props
    const { insert, alter, remove } = useMessage()
    const throttle = useThrottle(1000)
    const queryClient = useQueryClient()
    const { appearance } = useAppearance()
    const textarea = useRef<HTMLTextAreaElement>(null)
    const gifsClose = useRef<HTMLButtonElement>(null)

    const { editId, reference, content, image, gif, imagePreview } = useStore(useShallow(state => ({
        editId: state.editId,
        content: state.fields.content,
        reference: state.fields.reference,
        image: state.fields.image,
        gif: state.fields.gif,
        imagePreview: state.imagePreview,
    })))

    const set = useStore(state => state.set)
    const revokeImagePreview = useStore(state => state.revokeImagePreview)
    const clear = useStore(state => state.clear)

    const attachment = useMemo(() => {
        if (gif?.sm) {
            return gif.sm
        }

        if (typeof image === 'string') {
            return image
        }

        return imagePreview
    }, [image, gif, imagePreview])

    const channel = window.Echo.join(`room.${chatId}`)
    const replyTo = queryClient.getQueryData<InfiniteData<MessageResponse>>(['messages', chatId])
        ?.pages
        .flatMap(page => page.items)
        .find(message => message.id === reference)

    useEffect(() => {
        return () => {
            revokeImagePreview()
        }
    }, [revokeImagePreview])

    useEffect(() => {
        const keydownCancel = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && (editId || reference)) {
                event.preventDefault()
                clear()
            }
        }

        if (editId || reference) {
            setTimeout(() => {
                textarea.current?.focus()
            }, 400)
        }

        document.addEventListener('keydown', keydownCancel)

        return () => {
            document.removeEventListener('keydown', keydownCancel)
        }
    }, [editId, reference, clear])

    const { mutate: create, isPending: isCreating, reset } = useMutation<AxiosResponse<Message>, AxiosError<{ message: string }>, CreationPayload, CreationContext>({
        mutationFn: data => axios.post(`/chats/${chatId}/messages`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Socket-ID': window.Echo.socketId(),
            },
        }),
        async onMutate(payload, { client }) {
            await client.cancelQueries({ queryKey: ['messages', chatId] })

            const itemId = Math.floor(Math.random() * 1000000000).toString()
            const fakeImage = payload.image ? URL.createObjectURL(payload.image as File) : null

            insert(chatId, {
                id: itemId,
                reference: replyTo ? {
                    id: replyTo.id,
                    raw_content: replyTo.raw_content as (string | null),
                    image_url: replyTo.image_url,
                    gif: replyTo.gif,
                    from_self: replyTo.from_self,
                } : null,
                content: payload.content
                    ? new Remarkable({ html: false, breaks: true }).render(payload.content)
                    : null,
                gif: gif?.sm || null,
                image_url: fakeImage,
                from_self: true,
                reactions: [],
                date: new Date().toLocaleString(),
                date_diff: 'Today',
                time_diff: 'Now',
                is_fake: true,
            })

            clear()

            textarea.current?.focus()

            return { id: itemId, fakeImage }
        },
        onSuccess({ data }, payload, context) {
            alter(chatId, context.id, {
                ...data,
                date_diff: getDateDiff(data.date),
                time_diff: getTimeDiff(data.date),
                seen: undefined,
                is_fake: undefined,
            })
        },
        onError({ response }, payload, context) {
            const message = response?.status === 429
                ? response.data.message
                : 'Something went wrong'

            if (context) {
                remove(chatId, context.id, false)
            }

            toast.error(message, {
                className: 'right-5! w-[calc(100%-30px)]! sm:w-[calc(100%-40px)]! md:right-1/2! md:w-auto! md:translate-x-[calc(50%+8rem)]',
            })
        },
        async onSettled(data, error, payload, context, { client }) {
            if (context?.fakeImage) {
                URL.revokeObjectURL(context.fakeImage)
            }

            await client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })

            reset()
        },
    })

    const { mutate: update, isPending: isUpdating } = useMutation<AxiosResponse<Message>, AxiosError<{ message: string }>, UpdatePayload>({
        mutationFn: ({ id, ...payload }) => axios.post(
            `/chats/${chatId}/messages/${id}`,
            { _method: 'PATCH', ...payload },
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Socket-ID': window.Echo.socketId(),
                },
            },
        ),
        async onMutate(payload, { client }) {
            await client.cancelQueries({ queryKey: ['messages', chatId] })

            textarea.current?.focus()
        },
        onSuccess({ data }, { id }) {
            alter(chatId, id, data)
            clear()
        },
        onError({ response }) {
            const message = response?.status === 429
                ? response.data.message
                : 'Something went wrong'

            toast.error(message, {
                className: 'right-5! w-[calc(100%-30px)]! sm:w-[calc(100%-40px)]! md:right-1/2! md:w-auto! md:translate-x-[calc(50%+8rem)]',
            })
        },
        onSettled(data, error, payload, context, { client }) {
            client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })
        },
    })

    function handleMessage(event: ChangeEvent<HTMLTextAreaElement>) {
        set('content', event.target.value)

        throttle(() => {
            channel.whisper('typing', {})
        })
    }

    function insertEmoji({ emoji }: EmojiClickData) {
        if (isUpdating) {
            return
        }

        const input = textarea.current as HTMLTextAreaElement
        const start = input.selectionStart
        const end = input.selectionEnd
        const value = content || ''

        set(
            'content',
            value.substring(0, start) + emoji + value.substring(end),
        )

        input.focus()

        setTimeout(() => {
            input.selectionStart = start + emoji.length
            input.selectionEnd = start + emoji.length
        }, 0)
    }

    function upload(event: ChangeEvent<HTMLInputElement>) {
        if (isUpdating) {
            return
        }

        const file = (event.target.files as FileList)[0]

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return
        }

        revokeImagePreview()
        set('gif', null)
        set('image', file)
        set('imagePreview', URL.createObjectURL(file))
    }

    function selectGif(gif: { md: string; sm: string }) {
        revokeImagePreview()
        set('image', null)
        set('gif', gif)

        gifsClose.current?.click()
    }

    function removeUpload() {
        revokeImagePreview()
        set('image', null)
        set('gif', null)
    }

    function cancelEditMode() {
        if (isUpdating) {
            return
        }

        clear()
    }

    function handleSubmit(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
        if (!event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            textarea.current?.form?.requestSubmit()
        }
    }

    function send(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()

        if ((!content?.trim().length && !image && !gif) || isUpdating) {
            return
        }

        if (editId) {
            update({
                id: editId,
                reference_id: reference || '',
                content: content || '',
                image: image || '',
                gif: gif?.md || '',
            })
        } else {
            create({
                reference_id: reference || '',
                content: content || '',
                image: image || '',
                gif: gif?.md || '',
                seen: onlineIds.current.length >= 2,
            })
        }
    }

    return (
        <form onSubmit={send} className='z-10'>
            {!!replyTo && (
                <div className=''>
                    <Card size='sm' className='relative bg-transparent!'>
                        <CardContent className='flex items-center gap-4'>
                            {!!replyTo.image_url && (
                                <img src={replyTo.image_url} alt='Attachment' className='block max-h-12 max-w-12 rounded-xs' />
                            )}

                            <p className='line-clamp-2 w-full text-muted-foreground italic'>{replyTo.raw_content || '(Sent an image)'}</p>

                            <Button
                                type='button'
                                variant='ghost'
                                size='icon-sm'
                                className='size-5 rounded-full'
                                onClick={set.bind(null, 'reference', null)}
                            >
                                <X />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <InputGroup className='items-end rounded-none border-x-0 border-b-0 border-border dark:border-input/60 dark:bg-transparent'>
                <InputGroupTextarea
                    ref={textarea}
                    name='message'
                    value={content || ''}
                    placeholder='Write a message'
                    disabled={isUpdating}
                    className='px-4'
                    onKeyDown={handleSubmit}
                    onChange={handleMessage}
                />

                {(!!attachment && !isCreating) && (
                    <div className='w-full px-4 pt-3'>
                        <div className='relative inline-block'>
                            <img src={attachment} className='block max-h-20 max-w-20 rounded' />

                            <Button
                                type='button'
                                variant='outline'
                                size='icon-xs'
                                className='absolute -top-2.5 -right-2.5 bg-background!'
                                disabled={isUpdating}
                                onClick={removeUpload}
                            >
                                <X />
                            </Button>
                        </div>
                    </div>
                )}

                <InputGroupAddon align='block-end'>
                    <Popover>
                        <PopoverTrigger asChild className='data-[state=open]:text-accent-foreground'>
                            <InputGroupButton
                                type='button'
                                variant='ghost'
                                size='icon-xs'
                                disabled={isUpdating}
                            >
                                <Smile />
                            </InputGroupButton>
                        </PopoverTrigger>
                        <PopoverContent align='start' className='w-auto p-2'>
                            <EmojiPicker
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
                        disabled={isUpdating}
                    >
                        <label className='flex size-full items-center justify-center rounded-full'>
                            <Image />
                            <input
                                type='file'
                                accept='image/jpeg, image/png, image/webp'
                                className='hidden'
                                disabled={isUpdating}
                                onChange={upload}
                            />
                        </label>
                    </InputGroupButton>
                    <Popover>
                        <PopoverTrigger asChild className='data-[state=open]:text-accent-foreground'>
                            <InputGroupButton
                                type='button'
                                variant='ghost'
                                size='icon-xs'
                                disabled={isUpdating}
                            >
                                <svg viewBox='0 0 20 20' fill='currentColor'>
                                    <path fillRule='evenodd' d='M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm4.026 2.879C5.356 7.65 5.72 7.5 6 7.5s.643.15.974.629a.75.75 0 0 0 1.234-.854C7.66 6.484 6.873 6 6 6c-.873 0-1.66.484-2.208 1.275C3.25 8.059 3 9.048 3 10c0 .952.25 1.941.792 2.725C4.34 13.516 5.127 14 6 14c.873 0 1.66-.484 2.208-1.275a.75.75 0 0 0 .133-.427V10a.75.75 0 0 0-.75-.75H6.25a.75.75 0 0 0 0 1.5h.591v1.295c-.293.342-.6.455-.841.455-.279 0-.643-.15-.974-.629C4.69 11.386 4.5 10.711 4.5 10c0-.711.19-1.386.526-1.871ZM10.75 6a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Zm3 0h2.5a.75.75 0 0 1 0 1.5H14.5v1.75h.75a.75.75 0 0 1 0 1.5h-.75v2.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Z' clipRule='evenodd' />
                                </svg>
                            </InputGroupButton>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto space-y-2 px-2! pt-2! pb-0!' align='start'>
                            <GifPicker onSelect={selectGif} />
                            <PopoverPrimitive.Close ref={gifsClose} className='hidden' />
                        </PopoverContent>
                    </Popover>
                    {(!!editId && !isUpdating) && (
                        <InputGroupButton
                            type='submit'
                            variant='destructive'
                            size='xs'
                            className='ml-auto pr-3! text-xs'
                            onClick={cancelEditMode}
                        >
                            <X />
                            <span>Cancel</span>
                        </InputGroupButton>
                    )}
                    <InputGroupButton
                        type='submit'
                        variant='ghost'
                        size='xs'
                        disabled={isUpdating}
                        className={cn(
                            'text-xs text-accent-foreground/80',
                            { 'ml-auto': !editId || isUpdating },
                        )}
                    >
                        <span>Send</span>
                        <SendHorizonal />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </form>
    )
}
