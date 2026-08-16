import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import { Edit, EllipsisVertical, Reply, Trash2 } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'

import { ChatContext } from '@/components/chat-provider'
import MessageEditor from '@/components/message-editor'
import Photo from '@/components/photo'
import { Attachment } from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MessageContent } from '@/components/ui/message'
import { getTimeDiff } from '@/hooks/use-datetime'
import { useDebounce } from '@/hooks/use-limit'
import useMessage from '@/hooks/use-message'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/models'

type Props = {
    chatId: number;
    message: Message;
    firstInAMinute: boolean;
}

export default function MessageModel({ chatId, message, firstInAMinute }: Props) {
    const queryClient = useQueryClient()
    const messageToDelete = useRef<Message>(null)
    const [editMode, setEditMode] = useState<boolean>(false)
    const { reference, setReference } = useContext(ChatContext)
    const [date, setDate] = useState(getTimeDiff(message.date))
    const { alter, remove } = useMessage()
    const { debounce, stopDebounce, canStopDebounce } = useDebounce(5000)

    const { mutate } = useMutation<AxiosResponse, Error, { deletedMessage: Message }>({
        mutationFn: () => axios.delete(`/chats/${chatId}/messages/${message.id}`, {
            headers: {
                'X-Socket-ID': window.Echo.socketId(),
            },
        }),
        onError(error, { deletedMessage }) {
            alter(chatId, deletedMessage.id, deletedMessage)
        },
        async onSettled(data, error, payload, context, { client }) {
            await client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })

            messageToDelete.current = null
        },
    })

    function edit() {
        if ((!message.from_self && !message.is_fake) || reference) {
            return
        }

        setEditMode(true)
    }

    async function destroy() {
        if ((!message.from_self && !message.is_fake) || reference) {
            return
        }

        await queryClient.cancelQueries({ queryKey: ['messages', chatId] })

        messageToDelete.current = message

        remove(chatId, message.id)

        debounce(() => {
            mutate({ deletedMessage: messageToDelete.current as Message })
        })
    }

    function undoDestroy() {
        if (!message.from_self || !canStopDebounce) {
            return
        }

        alter(
            chatId,
            message.id,
            messageToDelete.current as Message,
        )

        stopDebounce()
    }

    function reply() {
        if (message.is_fake || reference) {
            return
        }

        setReference(message.id)
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
                    <BubbleContent className='flex items-center gap-2'>
                        <p className='italic'>Deleted message</p>

                        {(message.from_self && canStopDebounce) && (
                            <Button
                                variant='ghost'
                                size='xs'
                                className='bg-muted'
                                onClick={undoDestroy}
                            >
                                Undo
                            </Button>
                        )}
                    </BubbleContent>
                </Bubble>
            </MessageContent>
        )
    }

    if (message.from_self && editMode) {
        return (
            <MessageEditor
                cancel={setEditMode.bind(null, false)}
                chatId={chatId}
                message={message}
            />
        )
    }

    return (
        <MessageContent className='gap-1'>
            {(!message.is_fake && firstInAMinute) && (
                <p className='space-x-1 text-xs text-muted-foreground group-data-[align=end]/message:text-right'>
                    <span>{date}</span>
                    {message.edited && <span>(edited)</span>}
                </p>
            )}

            {(!message.is_fake && !firstInAMinute && message.edited) && (
                <p className='space-x-1 text-xs text-muted-foreground group-data-[align=end]/message:text-right'>(edited)</p>
            )}

            {!!message.reference && (
                <Card size='sm' className='responsive-message p-0'>
                    <CardContent className='relative flex items-center gap-2 px-4 py-(--card-spacing) before:absolute before:top-0 before:left-0 before:block before:h-full before:w-1 before:bg-primary before:content-[""]'>
                        {!!message.reference.image_url && (
                            <img src={message.reference.image_url} alt='Attachment' className='aspect-square w-12 rounded-xs' />
                        )}

                        <p className='line-clamp-2 w-full text-muted-foreground italic'>
                            {message.reference.raw_content || '(Sent an image)'}
                        </p>
                    </CardContent>
                </Card>
            )}

            <Bubble
                align={message.from_self ? 'end' : 'start'}
                variant={message.from_self ? 'default' : 'muted'}
                className={cn(
                    'responsive-message flex-row items-center gap-2',
                    {
                        'opacity-60': message.is_fake,
                        'flex-row-reverse': !message.from_self,
                    },
                )}
            >
                {message.from_self ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            asChild
                            className={cn(
                                'data-[state=closed]:invisible',
                                { 'data-[state=closed]:group-hover/bubble:visible': !message.is_fake && !reference },
                            )}
                        >
                            <Button variant='ghost' size='icon-sm'>
                                <EllipsisVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side={message.from_self ? 'left' : 'right'}
                            align={message.content && (message.image_url || message.gif) ? 'start' : 'center'}
                        >
                            <DropdownMenuItem asChild>
                                <Button className='w-full justify-start' variant='ghost' onClick={reply}>
                                    <Reply />
                                    <span>Reply</span>
                                </Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Button className='w-full justify-start' variant='ghost' onClick={edit}>
                                    <Edit />
                                    <span>Edit</span>
                                </Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Button className='w-full justify-start hover:text-destructive!' variant='ghost' onClick={destroy}>
                                    <Trash2 />
                                    <span>Delete</span>
                                </Button>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button
                        variant='ghost'
                        size='icon-sm'
                        className={cn(
                            'invisible',
                            { 'group-hover/bubble:visible': !message.is_fake && !reference },
                        )}
                        onClick={reply}
                    >
                        <Reply />
                    </Button>
                )}

                <div className='space-y-1'>
                    {!!message.content && (
                        <BubbleContent
                            dangerouslySetInnerHTML={{ __html: message.content }}
                            className={cn(
                                'space-y-2 overflow-auto!',
                                { 'ml-auto': message.from_self },
                            )}
                        />
                    )}

                    {(!!message.gif || !!message.image_url) && (
                        <Media message={message} />
                    )}
                </div>
            </Bubble>
        </MessageContent>
    )
}

function Media({ message }: { message: Message }) {
    if (message.is_fake && (message.image_url || message.gif)) {
        return (
            <img
                src={(message.image_url || message.gif) as string}
                className='responsive-message block max-h-60 w-full rounded-md object-cover blur-xs lg:max-h-120'
            />
        )
    }

    return (
        <div className={cn('flex', { 'justify-end': message.from_self })}>
            {message.gif ? (
                <Attachment orientation='vertical' className='w-[20vw] cursor-pointer'>
                    <div className='p-2'>
                        <Photo
                            src={message.gif}
                            className='block h-auto! w-full! rounded-md! object-cover'
                            skeletonClassName='size-25 rounded-md! lg:size-50'
                        />
                    </div>
                </Attachment>
            ) : (
                <Dialog>
                    <DialogTrigger>
                        <Attachment orientation='vertical' className='w-full cursor-pointer'>
                            <Photo
                                src={message.image_url as string}
                                className='block h-auto! max-h-60 w-full! rounded-md! object-cover lg:max-h-120'
                                skeletonClassName='size-25 rounded-md! lg:size-50'
                            />
                        </Attachment>
                    </DialogTrigger>
                    <DialogContent className='w-auto! max-w-full! p-0 sm:max-w-full! [&>button]:top-2 [&>button]:right-2 [&>button]:rounded-full [&>button]:bg-background [&>button]:p-1'>
                        <img src={message.image_url as string} className='block max-h-[90vh] max-w-[90vw] rounded-lg' />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
