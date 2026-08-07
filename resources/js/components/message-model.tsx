import { useSocketId } from '@laravel/echo-react'
import { type InfiniteData, useMutation } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'

import { MessageContentContext } from '@/components/message-content-provider'
import { Attachment, AttachmentMedia } from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Message, MessageContent } from '@/components/ui/message'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import { getTimeDiff } from '@/hooks/use-datetime'
import useMessage from '@/hooks/use-message'
import { cn } from '@/lib/utils'
import type { Message as MessageType, MessageResponse } from '@/types/models'

type Props = {
    conversationId: number;
    message: MessageType;
    firstInAMinute: boolean;
}

export default function MessageModel({ conversationId, message, firstInAMinute }: Props) {
    const [date, setDate] = useState(getTimeDiff(message.date))
    const [optionsOpen, setOptionsOpen] = useState(false)
    const { editId, setMessage, setEditId } = useContext(MessageContentContext)
    const { alter, remove } = useMessage()
    const socketId = useSocketId()
    const queryKey = ['messages', conversationId]

    const { mutate } = useMutation<AxiosResponse, Error, { id: number }, MessageType>({
        mutationFn: () => axios.delete(`/messages/${message.id}`, {
            headers: {
                'X-Socket-ID': socketId,
            },
        }),
        async onMutate({ id }, { client }) {
            await client.cancelQueries({ queryKey })

            const deletedMessage = client.getQueryData<InfiniteData<MessageResponse>>(queryKey)
                ?.pages
                .flatMap(page => page.items)
                .find(item => item.id === id) as MessageType

            remove(conversationId, id)

            return deletedMessage
        },
        onError(data, error, deletedMessage) {
            if (deletedMessage) {
                alter(conversationId, deletedMessage.id, deletedMessage)
            }
        },
        async onSettled(data, error, payload, context, { client }) {
            await client.invalidateQueries({
                queryKey,
                refetchType: 'none',
            })
        },
    })

    function edit() {
        if (!message.from_self || editId) {
            return
        }

        setEditId(message.id)
        setMessage(message.raw_content as string)
    }

    function destroy() {
        if (!message.from_self || editId) {
            return
        }

        mutate({ id: message.id })
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

    return (
        <MessageScrollerItem messageId={message.id.toString()}>
            <Message align={message.from_self ? 'end' : 'start'}>
                {message.deleted ? (
                    <MessageContent>
                        <Bubble align={message.from_self ? 'end' : 'start'} variant='outline'>
                            <BubbleContent>
                                <p className='italic'>Deleted message</p>
                            </BubbleContent>
                        </Bubble>
                    </MessageContent>
                ) : (
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

                        <Bubble
                            align={message.from_self ? 'end' : 'start'}
                            variant={message.from_self ? (editId === message.id ? 'tinted' : 'default') : 'muted'}
                            className={cn({ 'opacity-60': message.is_fake })}
                        >
                            {!!message.content && (
                                <div className='flex w-fit max-w-full min-w-0 items-center gap-2 overflow-hidden group-data-[align=end]/bubble:self-end'>
                                    {(message.from_self && !editId) && (
                                        <DropdownMenu open={optionsOpen} onOpenChange={setOptionsOpen}>
                                            <DropdownMenuTrigger asChild className={cn({ 'invisible group-hover/bubble:visible': !optionsOpen })}>
                                                <Button variant='ghost' size='icon-sm'>
                                                    <EllipsisVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent side='left'>
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
                                    )}

                                    <BubbleContent
                                        dangerouslySetInnerHTML={{ __html: message.content }}
                                        className='max-w-auto! w-auto! min-w-auto! space-y-2'
                                    />
                                </div>
                            )}

                            {((message.is_fake && message.has_image) || !!message.gif || !!message.image_url) && (
                                <Media message={message} />
                            )}
                        </Bubble>
                    </MessageContent>
                )}
            </Message>
        </MessageScrollerItem>
    )
}

function Media({ message }: { message: MessageType }) {
    if (message.is_fake && message.has_image) {
        return (
            <Attachment orientation='vertical' state='uploading'>
                <AttachmentMedia>
                    <Spinner />
                </AttachmentMedia>
            </Attachment>
        )
    }

    if (message.gif) {
        return (
            <Attachment orientation='vertical' className='w-[20vw] cursor-pointer'>
                <div className='p-2'>
                    <img src={message.gif} className='block w-full rounded-md object-cover' />
                </div>
            </Attachment>
        )
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Attachment orientation='vertical' className='w-full max-w-[70vw] cursor-pointer md:max-w-[50vw] lg:max-w-120'>
                    <img src={message.image_url as string} className='block max-h-120 w-full rounded-md object-cover' />
                </Attachment>
            </DialogTrigger>
            <DialogContent className='w-auto! max-w-full! p-0 sm:max-w-full! [&>button]:rounded-full [&>button]:bg-background [&>button]:p-1'>
                <img src={message.image_url as string} className='block max-h-[90vh] max-w-[90vw] rounded-lg' />
            </DialogContent>
        </Dialog>
    )
}
