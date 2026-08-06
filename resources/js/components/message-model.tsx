import { Edit, EllipsisVertical, Trash2 } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'

import { Attachment, AttachmentMedia } from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Message, MessageContent } from '@/components/ui/message'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import { getTimeDiff } from '@/hooks/use-datetime'
import { cn } from '@/lib/utils'
import type { Message as MessageType } from '@/types/models'

import { MessageContentContext } from './message-content-provider'

export default function MessageModel({ message, firstInAMinute }: { message: MessageType; firstInAMinute: boolean; }) {
    const [date, setDate] = useState(getTimeDiff(message.date))
    const [optionsOpen, setOptionsOpen] = useState(false)
    const { editId, setMessage, setEditId } = useContext(MessageContentContext)

    function edit() {
        if (editId) {
            return
        }

        setEditId(message.id)
        setMessage(message.raw_content as string)
    }

    useEffect(() => {
        if (!message.is_fake && firstInAMinute) {
            const interval = setInterval(() => {
                setDate(getTimeDiff(message.date))
            }, 60000)

            return () => {
                clearInterval(interval)
            }
        }
    }, [message.date, message.is_fake, firstInAMinute])

    return (
        <MessageScrollerItem messageId={message.id.toString()}>
            <Message align={message.from_self ? 'end' : 'start'}>
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
                                {!editId && (
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
                                                <Button className='w-full justify-start hover:text-destructive!' variant='ghost'>
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
