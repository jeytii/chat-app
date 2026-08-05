import { useEffect, useState } from 'react'

import { Attachment, AttachmentMedia } from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Message, MessageContent } from '@/components/ui/message'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import { getTimeDiff } from '@/hooks/use-datetime'
import type { Message as MessageType } from '@/types/models'

export default function MessageModel({ message, firstInAMinute }: { message: MessageType; firstInAMinute: boolean; }) {
    const [date, setDate] = useState(getTimeDiff(message.date))

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
                        <p className='text-xs text-muted-foreground group-data-[align=end]/message:text-right'>
                            {date}
                        </p>
                    )}

                    {!!message.content && (
                        <Bubble variant={message.from_self ? 'default' : 'muted'}>
                            <BubbleContent dangerouslySetInnerHTML={{ __html: message.content }} className='space-y-2' />
                        </Bubble>
                    )}

                    {((message.is_fake && message.has_image) || !!message.gif || !!message.image_url) && (
                        <Media message={message} />
                    )}
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
            <DialogContent className='w-auto! max-w-full! sm:max-w-full!'>
                <img src={message.image_url as string} className='block max-h-[90vh] max-w-[90vw]' />
            </DialogContent>
        </Dialog>
    )
}
