import { useMutation } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import EmojiPicker, { type EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react'
import { Edit, Reply, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { Attachment } from '@/components/ui/attachment'
import { Badge } from '@/components/ui/badge'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { MessageContent, MessageFooter, MessageHeader } from '@/components/ui/message'
import { useAppearance } from '@/hooks/use-appearance'
import { getTimeDiff } from '@/hooks/use-datetime'
import { useDebounce } from '@/hooks/use-limit'
import useMessage from '@/hooks/use-message'
import useStore from '@/hooks/useStore'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/models'

type Props = {
    chatId: string;
    message: Message;
    firstInAMinute: boolean;
}

export default function MessageModel({ chatId, message, firstInAMinute }: Props) {
    const [date, setDate] = useState(getTimeDiff(message.date))
    const { alter, remove } = useMessage()
    const { debounce, stopDebounce, canStopDebounce } = useDebounce(5000)
    const { appearance } = useAppearance()
    const reactionsCount = message.reactions.reduce((total, message) => total + message.total, 0)
    const reactions = message.reactions.filter(reaction => reaction.total)

    const { editId, reference } = useStore(useShallow(state => ({
        editId: state.editId,
        reference: state.fields.reference,
    })))

    const set = useStore(state => state.set)
    const revokeImagePreview = useStore(state => state.revokeImagePreview)
    const clear = useStore(state => state.clear)

    const { mutate: destroy, context: destroyContext, reset: resetDestroy } = useMutation<AxiosResponse, Error, { message: Message }, { message: Message }>({
        mutationFn: () => axios.delete(`/chats/${chatId}/messages/${message.id}`, {
            headers: {
                'X-Socket-ID': window.Echo.socketId(),
            },
        }),
        async onMutate({ message }, { client }) {
            await client.cancelQueries({ queryKey: ['messages', chatId] })

            remove(chatId, message.id)

            if (editId === message.id) {
                clear()
            }

            debounce(resetDestroy)

            return { message }
        },
        onSettled(data, error, payload, context, { client }) {
            client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })
        },
    })

    const { mutate: restore } = useMutation<AxiosResponse, Error, { message: Message }>({
        mutationFn: () => axios.put(`/chats/${chatId}/messages/${message.id}/restore`),
        onMutate({ message: deletedMessage }) {
            alter(chatId, message.id, deletedMessage)
            stopDebounce()
        },
        onSuccess() {
            resetDestroy()
        },
        onSettled(data, error, payload, context, { client }) {
            client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })
        },
    })

    const { mutate: reactToMessage } = useMutation<AxiosResponse, Error, { name: string; emoji: string; has_reacted: boolean; }>({
        mutationFn: data => axios.post(`/chats/${chatId}/messages/${message.id}/react`, data, {
            headers: {
                'X-Socket-ID': window.Echo.socketId(),
            },
        }),
        onMutate({ name, emoji, has_reacted: hasReacted }) {
            alter(chatId, message.id, {
                reactions: message.reactions.findIndex(reaction => reaction.name === name) !== -1
                    ? message.reactions.map(reaction => (
                        reaction.name === name
                            ? {
                                ...reaction,
                                total: hasReacted ? reaction.total - 1 : reaction.total + 1,
                                has_reacted: !hasReacted,
                            }
                            : reaction
                    ))
                    : [...message.reactions, {
                        name,
                        emoji,
                        has_reacted: true,
                        total: 1,
                    }],
            })
        },
        onSuccess(data, payload, context, { client }) {
            client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })
        },
    })

    function edit() {
        if ((!message.from_self && !message.is_fake) || reference) {
            return
        }

        set('editId', message.id)
        set('content', message.raw_content || null)
        set('reference', message.reference?.id || null)

        revokeImagePreview()

        set('image', message.image_url)
        set('gif', {
            md: message.gif,
            sm: message.gif,
        })
    }

    async function deleteMessage() {
        if ((!message.from_self && !message.is_fake) || reference) {
            return
        }

        destroy({ message })
    }

    function undoDelete() {
        const deletedMessage = destroyContext?.message

        if (
            !deletedMessage
            || !deletedMessage.from_self
            || message.id !== deletedMessage.id
            || !canStopDebounce
        ) {
            return
        }

        restore({ message: deletedMessage })
    }

    function reply() {
        if (message.is_fake || reference) {
            return
        }

        clear()
        set('reference', message.id)
    }

    function react({ emoji, unified: name }: EmojiClickData) {
        const reaction = message.reactions.find(reaction => reaction.name === name)

        reactToMessage({
            name,
            emoji,
            has_reacted: reaction?.has_reacted || false,
        })
    }

    useEffect(() => {
        if (!message.is_fake && firstInAMinute) {
            const interval = setInterval(() => {
                setDate(getTimeDiff(message.date))
            }, 60000)

            if (message.deleted) {
                clearInterval(interval)
            }

            return () => {
                if (interval) {
                    clearInterval(interval)
                }
            }
        }
    }, [message.date, message.deleted, message.is_fake, firstInAMinute])

    if (message.deleted) {
        return (
            <MessageContent>
                <Bubble align={message.from_self ? 'end' : 'start'} variant='outline'>
                    <BubbleContent className='flex items-center gap-2 rounded-[8px] py-1'>
                        <p className='italic'>Deleted message</p>

                        {(message.from_self && canStopDebounce) && (
                            <Button
                                variant='ghost'
                                size='xs'
                                className='bg-muted'
                                onClick={undoDelete}
                            >
                                Undo
                            </Button>
                        )}
                    </BubbleContent>
                </Bubble>
            </MessageContent>
        )
    }

    return (
        <MessageContent className='gap-1'>
            <MessageHeader className='px-1 select-none'>
                {(!message.is_fake && firstInAMinute) && (
                    <p className='space-x-1 text-xs text-muted-foreground group-data-[align=end]/message:text-right'>
                        <span>{date}</span>
                        {message.edited && <span>(edited)</span>}
                    </p>
                )}

                {(!message.is_fake && !firstInAMinute && message.edited) && (
                    <p className='space-x-1 text-xs text-muted-foreground group-data-[align=end]/message:text-right'>edited</p>
                )}
            </MessageHeader>

            {!!message.reference && (
                <Card size='sm' className='w-fit max-w-[70vw]! rounded-[8px]! p-0 md:max-w-[50vw]! lg:max-w-180!'>
                    <CardContent className='relative flex items-center gap-2 px-4 py-1 before:absolute before:top-0 before:left-0 before:block before:h-full before:w-1 before:bg-primary before:content-[""]'>
                        {!!message.reference.image_url && (
                            <img src={message.reference.image_url} alt='Attachment' className='block max-h-12 max-w-12 rounded-xs' />
                        )}

                        <p className='line-clamp-2 w-full text-muted-foreground italic'>
                            {message.reference.raw_content || '(Sent an image)'}
                        </p>
                    </CardContent>
                </Card>
            )}

            <ContextMenu>
                <ContextMenuTrigger>
                    <Bubble
                        align={message.from_self ? 'end' : 'start'}
                        variant={message.from_self ? 'tinted' : 'muted'}
                        className='max-w-[70vw]! md:max-w-[50vw]! lg:max-w-180!'
                    >
                        {!!message.content && (
                            <BubbleContent
                                dangerouslySetInnerHTML={{ __html: message.content }}
                                className={cn(
                                    'space-y-2 overflow-auto! rounded-[8px] py-1 [&_*:not(a[href])]:select-none',
                                    { 'ml-auto': message.from_self },
                                    { 'opacity-60': message.is_fake },
                                )}
                            />
                        )}

                        {(!!message.gif || !!message.image_url) && (
                            <Media message={message} />
                        )}
                    </Bubble>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem className='bg-transparent! p-0!'>
                        <EmojiPicker
                            reactionsDefaultOpen
                            allowExpandReactions={false}
                            reactions={['1f44d', '2764-fe0f', '1f60d', '1f602', '1f440', '1f60a', '1f44e']}
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
                            onReactionClick={react}
                        />
                    </ContextMenuItem>

                    {message.from_self ? (
                        <>
                            <ContextMenuItem asChild>
                                <Button className='w-full justify-start' variant='ghost' onClick={reply}>
                                    <Reply />
                                    <span>Reply</span>
                                </Button>
                            </ContextMenuItem>
                            <ContextMenuItem asChild>
                                <Button className='w-full justify-start' variant='ghost' onClick={edit}>
                                    <Edit />
                                    <span>Edit</span>
                                </Button>
                            </ContextMenuItem>
                            <ContextMenuItem asChild>
                                <Button className='w-full justify-start hover:text-destructive!' variant='ghost' onClick={deleteMessage}>
                                    <Trash2 />
                                    <span>Delete</span>
                                </Button>
                            </ContextMenuItem>
                        </>
                    ) : (
                        <ContextMenuItem asChild>
                            <Button className='w-full justify-start' variant='ghost' onClick={reply}>
                                <Reply />
                                <span>Reply</span>
                            </Button>
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            {!!reactionsCount && (
                <MessageFooter className='px-0'>
                    <Badge variant='outline' className='px-2 py-1'>
                        {reactions.map(reaction => (
                            <span key={reaction.name}>{reaction.emoji}</span>
                        ))}

                        <span>{reactionsCount}</span>
                    </Badge>
                </MessageFooter>
            )}
        </MessageContent>
    )
}

function Media({ message }: { message: Message }) {
    if (message.gif) {
        return (
            <div className={cn('flex', { 'justify-end': message.from_self })}>
                <img
                    src={message.gif}
                    className='block h-auto max-h-60 w-full rounded-md object-cover lg:max-h-100 lg:max-w-120'
                    alt='GIF'
                />
            </div>
        )
    }

    return (
        <div className={cn('flex', { 'justify-end': message.from_self })}>
            <Dialog>
                <DialogTrigger>
                    <Attachment orientation='vertical' className='w-full cursor-pointer'>
                        <img
                            src={message.image_url as string}
                            className='block h-auto max-h-60 w-full rounded-md object-cover lg:max-h-100 lg:max-w-120'
                            alt='Attachment'
                        />
                    </Attachment>
                </DialogTrigger>
                <DialogContent className='w-auto! max-w-full! p-0 sm:max-w-full! [&>button]:top-2 [&>button]:right-2 [&>button]:rounded-full [&>button]:bg-background [&>button]:p-1'>
                    <img src={message.image_url as string} className='block max-h-[90vh] max-w-[90vw] rounded-lg' />
                </DialogContent>
            </Dialog>
        </div>
    )
}
