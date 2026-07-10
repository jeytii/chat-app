import { usePage } from '@inertiajs/react'
import { useMessageScroller } from '@shadcn/react/message-scroller'
import type { InfiniteData } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import type { EmojiClickData } from 'emoji-picker-react'
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react'
import { Image, SendHorizonal, Smile } from 'lucide-react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Remarkable } from 'remarkable'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppearance } from '@/hooks/use-appearance'
import type { Message, MessageResponse } from '@/types/models'

type PageProps = {
    conversation: { id: number; }
}

export default function MessageBox() {
    const { id } = usePage<PageProps>().props.conversation
    const [message, setMessage] = useState<string>('')
    const [showEmojis, setShowEmojis] = useState<boolean>(false)
    const queryClient = useQueryClient()
    const textarea = useRef<HTMLTextAreaElement>(null)
    const { scrollToEnd } = useMessageScroller()
    const { appearance } = useAppearance()
    const queryKey = ['messages', id]

    useEffect(() => {
        return () => {
            setMessage('')
        }
    }, [])

    const { mutate } = useMutation<AxiosResponse<Message>, Error, string, { id: number }>({
        mutationFn: message => axios.post('/messages', {
            conversation_id: id,
            message,
        }),
        async onMutate() {
            await queryClient.cancelQueries({ queryKey })

            const itemId = Math.floor(Math.random() * 1000000000)

            queryClient.setQueryData<InfiniteData<MessageResponse>>(
                queryKey,
                current => {
                    if (!current) {
                        return current
                    }

                    const newItem = {
                        id: itemId,
                        content: new Remarkable({ html: false, breaks: true }).render(message),
                        gif: null,
                        image_url: null,
                        from_self: true,
                    }

                    // Insert new item into a new page if the latest one has reached the pagination count
                    if (current.pages[current.pages.length - 1].items.length >= 20) {
                        return {
                            pageParams: [
                                null,
                                ...current.pageParams,
                            ],
                            pages: [
                                ...current.pages,
                                {
                                    items: [newItem],
                                    next_cursor: null,
                                },
                            ],
                        }
                    }

                    // Else, push it into the latest page
                    return {
                        ...current,
                        pages: current.pages.map((page, index, pages) => {
                            if (index === pages.length - 1) {
                                return {
                                    ...page,
                                    items: [...page.items, newItem],
                                }
                            }

                            return page
                        }),
                    }
                },
            )

            setTimeout(() => [
                scrollToEnd({
                    behavior: 'instant',
                }),
            ])

            setMessage('')

            return { id: itemId }
        },
        onSuccess({ data }, variables, context) {
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

    function handleSubmit(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (!event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            send()
        }
    }

    function send() {
        const value = message.trim()

        if (!value.length) {
            return
        }

        mutate(value)
    }

    return (
        <div className='z-10'>
            <InputGroup className='items-end border-x-0 border-b-0 rounded-none dark:bg-transparent'>
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
                    <InputGroupButton variant='ghost' size='icon-xs'>
                        <Image />
                    </InputGroupButton>
                    <InputGroupButton variant='ghost' size='xs'>
                        GIF
                    </InputGroupButton>
                    <InputGroupButton
                        variant='ghost'
                        size='icon-xs'
                        disabled={!message.trim().length}
                        className='ml-auto'
                        onClick={send}
                    >
                        <SendHorizonal />
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    )
}
