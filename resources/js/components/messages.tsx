import { usePage } from '@inertiajs/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Skeleton } from './ui/skeleton'

type PageProps = {
    conversation: { id: number; }
}

type Message = {
    id: number;
    content: string | null;
    gif: string | null;
    image_url: string | null;
    from_self: boolean;
}

export default function Messages() {
    const { props } = usePage<PageProps>()
    const { data, isLoading } = useInfiniteQuery<Message[]>({
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
        <div className='flex h-full max-h-[100vh-64] flex-1 flex-col gap-2 justify-end-safe overflow-y-auto rounded-xl p-4'>
            {data.pages.map((messages, index) => (
                <div key={`group-${index}`} className='space-y-2'>
                    {messages.map(message => (
                        <Message key={message.id} message={message} />
                    ))}
                </div>
            ))}
        </div>
    )
}

function Message({ message }: { message: Message }) {
    if (message.from_self) {
        return (
            <div className='flex justify-end-safe'>
                <div className='relative inline-block max-w-[95%]'>
                    <div
                        className='bg-primary text-primary-foreground text-sm rounded-lg py-2 px-4'
                        dangerouslySetInnerHTML={{ __html: message.content as string }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div>
            <div
                className='inline-block max-w-[95%] bg-muted text-foreground text-sm rounded-lg py-2 px-4'
                dangerouslySetInnerHTML={{ __html: message.content as string }}
            />
        </div>
    )
}
