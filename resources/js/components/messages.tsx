import { usePage } from '@inertiajs/react'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect } from 'react'
import MessageModel from '@/components/message-model'
import { MessageScrollerContent, useMessageScrollerScrollable } from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import type { Message, MessageResponse } from '@/types/models'

type PageProps = {
    conversation: { id: number; }
}

async function getMessages(pageParam: string|null, conversationId: number, signal: AbortSignal) {
    const { data } = await axios<MessageResponse>('/messages', {
        params: {
            conversation_id: conversationId,
            cursor: pageParam,
        },
        signal,
    })

    return data
}

export default function Messages() {
    const { id } = usePage<PageProps>().props.conversation
    const { data, isLoading, fetchPreviousPage, isFetchingPreviousPage } = useInfiniteQuery<MessageResponse, Error, InfiniteData<Message>, readonly unknown[], string|null>({
        queryKey: ['messages', id],
        queryFn: ({ pageParam, signal }) => getMessages(pageParam, id, signal),
        initialPageParam: null,
        getPreviousPageParam: lastPage => lastPage.next_cursor,
        getNextPageParam: () => null,
        select: data => ({
            ...data,
            pages: data.pages.flatMap(page => page.items),
        }),
    })

    const { start, end } = useMessageScrollerScrollable()

    useEffect(() => {
        if (end && !start && !isFetchingPreviousPage) {
            fetchPreviousPage()
        }
    }, [start, end, isFetchingPreviousPage, fetchPreviousPage])

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

    if (!data.pages.length) {
        return (
            <div className='flex h-full max-h-[100vh-64] flex-1 flex-col gap-2 justify-end-safe overflow-y-auto rounded-xl p-4'>
                <p className='text-muted-foreground text-center'>Say hello to start a conversation.</p>
            </div>
        )
    }

    return (
        <MessageScrollerContent className='justify-end gap-2 py-4 px-2'>
            {isFetchingPreviousPage && <p className='text-center text-muted-foreground py-2'>Loading...</p>}

            {data.pages.map(message => (
                <MessageModel key={message.id} message={message} />
            ))}
        </MessageScrollerContent>
    )
}
