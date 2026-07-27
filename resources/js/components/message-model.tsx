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
            <Attachment orientation='vertical' className='cursor-pointer w-[20vw]'>
                <div className='p-2'>
                    <img src={message.gif} className='block w-full object-cover rounded-md' />
                </div>
            </Attachment>
        )
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Attachment orientation='vertical' className='cursor-pointer w-full max-w-[70vw] md:max-w-[50vw] lg:max-w-120'>
                    <img src={message.image_url as string} className='block w-full max-h-120 object-cover rounded-md' />
                </Attachment>
            </DialogTrigger>
            <DialogContent className='w-auto! max-w-full! sm:max-w-full!'>
                <img src={message.image_url as string} className='block min-size-full max-w-[90vw] max-h-[90vh]' />
            </DialogContent>
        </Dialog>
    )
}
