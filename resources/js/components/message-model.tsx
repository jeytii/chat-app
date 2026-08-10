import { useSocketId } from '@laravel/echo-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { MouseEventHandler, useEffect, useRef, useState } from 'react'

import MessageEditor from '@/components/message-editor'
import { Attachment } from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MessageContent } from '@/components/ui/message'
import { getTimeDiff } from '@/hooks/use-datetime'
import { useDebounce } from '@/hooks/use-limit'
import useMessage from '@/hooks/use-message'
import { cn } from '@/lib/utils'
import type { Message as Message } from '@/types/models'

type Props = {
    chatId: number;
    message: Message;
    firstInAMinute: boolean;
}

export default function MessageModel({ chatId, message, firstInAMinute }: Props) {
    const queryClient = useQueryClient()
    const messageToDelete = useRef<Message>(null)
    const [editMode, setEditMode] = useState<boolean>(false)
    const [date, setDate] = useState(getTimeDiff(message.date))
    const { alter, remove } = useMessage()
    const { debounce, stopDebounce, canStopDebounce } = useDebounce(5000)
    const socketId = useSocketId()

    const { mutate } = useMutation<AxiosResponse, Error, { deletedMessage: Message }>({
        mutationFn: () => axios.delete(`/chats/${chatId}/messages/${message.id}`, {
            headers: {
                'X-Socket-ID': socketId,
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
        if (!message.from_self) {
            return
        }

        setEditMode(true)
    }

    async function destroy() {
        if (!message.from_self) {
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

            {(message.from_self && editMode) ? (
                <MessageEditor
                    cancel={setEditMode.bind(null, false)}
                    {...{ message, chatId, socketId }}
                />
            ) : (
                <Bubble
                    align={message.from_self ? 'end' : 'start'}
                    variant={message.from_self ? 'default' : 'muted'}
                    className={cn({ 'opacity-60': message.is_fake })}
                >
                    {!!message.content && (
                        <div className='flex w-fit max-w-full min-w-0 items-center gap-2 overflow-hidden group-data-[align=end]/bubble:self-end'>
                            {message.from_self && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild className='data-[state=closed]:invisible data-[state=closed]:group-hover/bubble:visible'>
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

                    {(!!message.gif || !!message.image_url) && (
                        <Media {...{ message, edit, destroy }} />
                    )}
                </Bubble>
            )}

        </MessageContent>
    )
}

function Media({ message, edit, destroy }: { message: Message; edit: MouseEventHandler; destroy: MouseEventHandler }) {
    if (message.is_fake && (message.image_url || message.gif)) {
        return (
            <img
                src={(message.image_url || message.gif) as string}
                className='block max-h-60 w-full max-w-[70vw] rounded-md object-cover opacity-60 md:max-w-[50vw] lg:max-h-120 lg:max-w-120'
            />
        )
    }

    return (
        <div className='flex gap-2'>
            {(message.from_self && !message.content) && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild className='data-[state=closed]:invisible data-[state=closed]:group-hover/bubble:visible'>
                        <Button variant='ghost' size='icon-sm'>
                            <EllipsisVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side='left' align='start'>
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

            {message.gif ? (
                <Attachment orientation='vertical' className='w-[20vw] cursor-pointer'>
                    <div className='p-2'>
                        <img src={message.gif} className='block w-full rounded-md object-cover' />
                    </div>
                </Attachment>
            ) : (
                <Dialog>
                    <DialogTrigger>
                        <Attachment orientation='vertical' className='w-full max-w-[70vw] cursor-pointer md:max-w-[50vw] lg:max-w-120'>
                            <img src={message.image_url as string} className='block max-h-60 w-full rounded-md object-cover lg:max-h-120' />
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
