import { usePage } from '@inertiajs/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Message, MessageContent } from '@/components/ui/message'
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import type { Message as MessageModel } from '@/types/models'

type PageProps = {
    conversation: { id: number; }
}

export default function Messages() {
    const { props } = usePage<PageProps>()
    const { data, isLoading } = useInfiniteQuery<MessageModel[]>({
        queryKey: ['messages', props.conversation.id],
        queryFn: async () => (await fetch(`/messages?conversation_id=${props.conversation.id}`)).json(),
        initialPageParam: 0,
        getNextPageParam: () => 1,
    })

    if (isLoading || !data) {
        return (
            <div className='flex h-full max-h-[100vh-64] flex-1 flex-col gap-2 justify-end-safe overflow-y-auto rounded-xl p-4'>
                <div>
                    <Skeleton className='h-10 max-w-[10%] ml-auto' />
                </div>
                <div>
                    <Skeleton className='h-10 max-w-[30%] ml-auto' />
                </div>
                <Skeleton className='h-10 max-w-[70%]' />
                <Skeleton className='h-10 max-w-[20%]' />
                <div>
                    <Skeleton className='h-10 max-w-[40%] ml-auto' />
                </div>
                <div>
                    <Skeleton className='h-10 max-w-[20%] ml-auto' />
                </div>
                <div>
                    <Skeleton className='h-16 max-w-[70%] ml-auto' />
                </div>
            </div>
        )
    }

    if (data.pages.length === 1 && !data.pages[0].length) {
        return (
            <div className='flex h-full max-h-[100vh-64] flex-1 flex-col gap-2 justify-end-safe overflow-y-auto rounded-xl p-4'>
                <p className='text-muted-foreground text-center'>Say hello to start a conversation.</p>
            </div>
        )
    }

    return (
        <MessageScrollerProvider defaultScrollPosition='last-anchor'>
            <div className='flex-1 max-h-full overflow-hidden'>
                <MessageScroller>
                    <MessageScrollerViewport>
                        <MessageScrollerContent className='justify-end py-4 px-2'>
                            {data.pages.flat().map(message => (
                                <MessageScrollerItem key={message.id} messageId={message.id.toString()}>
                                    <Message align={message.from_self ? 'end' : 'start'}>
                                        <MessageContent>
                                            <Bubble variant={message.from_self ? 'default' : 'muted'}>
                                                <BubbleContent dangerouslySetInnerHTML={{ __html: message.content as string }} />
                                            </Bubble>
                                        </MessageContent>
                                    </Message>
                                </MessageScrollerItem>
                            ))}
                        </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                </MessageScroller>
            </div>
        </MessageScrollerProvider>
    )
}
