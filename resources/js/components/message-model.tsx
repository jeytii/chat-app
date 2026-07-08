import { useEffect, useState } from 'react'
import { Attachment, AttachmentMedia } from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Message, MessageContent } from '@/components/ui/message'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import type { Message as MessageType } from '@/types/models'

export default function MessageModel({ message }: { message: MessageType }) {
    return (
        <MessageScrollerItem messageId={message.id.toString()}>
            <Message align={message.from_self ? 'end' : 'start'}>
                <MessageContent className='gap-1'>
                    <Bubble variant={message.from_self ? 'default' : 'muted'}>
                        <BubbleContent dangerouslySetInnerHTML={{ __html: message.content as string }} className='space-y-2' />
                    </Bubble>

                    {!!message.image_url && (
                        <Image imageUrl={message.image_url} />
                    )}

                    {!!message.gif && (
                        <Attachment orientation='vertical' className='cursor-pointer w-[20vw]'>
                            <div className='p-2'>
                                <img
                                    src={message.gif}
                                    alt=''
                                    className='block w-full object-cover rounded-md'
                                />
                            </div>
                        </Attachment>
                    )}
                </MessageContent>
            </Message>
        </MessageScrollerItem>
    )
}

function Image({ imageUrl }: { imageUrl: string }) {
    const [state, setState] = useState<'uploading' | 'error' | 'done'>('uploading')
    const [blobUrl, setBlobUrl] = useState<string>()

    useEffect(() => {
        fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob)

                setBlobUrl(url)
                setState('done')
            })
            .catch(() => {
                setState('error')
            })

        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl)
            }
        }
    }, [imageUrl, blobUrl])

    if (state === 'uploading') {
        return (
            <Attachment orientation='vertical' state={state}>
                <AttachmentMedia>
                    <Spinner />
                </AttachmentMedia>
            </Attachment>
        )
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Attachment orientation='vertical' className='cursor-pointer w-[20vw]'>
                    <div className='p-2'>
                        <img
                            src={blobUrl}
                            alt=''
                            className='block w-full object-cover rounded-md'
                        />
                    </div>
                </Attachment>
            </DialogTrigger>
            <DialogContent>
                <img
                    src={blobUrl}
                    alt=''
                    className='block w-full'
                />
            </DialogContent>
        </Dialog>
    )
}
