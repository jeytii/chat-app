import { usePage } from '@inertiajs/react'
import { useEcho } from '@laravel/echo-react'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Fragment, useEffect } from 'react'

import MessageModel from '@/components/message-model'
import { Marker, MarkerContent } from '@/components/ui/marker'
import { MessageScrollerContent, MessageScrollerItem, useMessageScroller, useMessageScrollerScrollable } from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import { useInsertMessage } from '@/hooks/use-insert-message'
import type { Message, MessageResponse } from '@/types/models'

type PageProps = {
    conversation: { id: number; }
}

function getDateLabel(date: string) {
    const givenDate = new Date(date)

    // Calculate the difference in milliseconds between the given date and today
    const mlsDiff = Math.abs(givenDate.getTime() - Date.now())

    // Convert milliseconds back to days
    const dayDiff = Math.floor(mlsDiff / (1000 * 60 * 60 * 24))

    if (dayDiff <= 0) {
        return 'Today'
    }

    if (dayDiff === 1) {
        return 'Yesterday'
    }

    return givenDate.toLocaleDateString('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    })
}

function areSameDate(date: string, previousDate: string) {
    return new Date(date).getTime() !== new Date(previousDate).getTime()
}

async function getMessages(pageParam: string | null, conversationId: number, signal: AbortSignal) {
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

    const { data, isLoading, fetchPreviousPage, isFetchingPreviousPage, hasPreviousPage } = useInfiniteQuery<
        MessageResponse,
        Error,
        InfiniteData<Message>,
        readonly unknown[],
        string | null
    >({
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

    const queryClient = useQueryClient()
    const insertMessage = useInsertMessage()
    const { scrollToEnd } = useMessageScroller()
    const { start, end } = useMessageScrollerScrollable()

    const { stopListening } = useEcho<Message>(`conversation.${id}`, 'MessageSent', async message => {
        await queryClient.cancelQueries({ queryKey: ['messages', id] })

        insertMessage(id, message, true)

        await queryClient.invalidateQueries({
            queryKey: ['messages', id],
            refetchType: 'none',
        })

        setTimeout(() => {
            scrollToEnd({
                behavior: 'instant',
            })
        }, 0)
    })

    useEffect(() => {
        if (end && !start && hasPreviousPage && !isFetchingPreviousPage) {
            fetchPreviousPage()
        }
    }, [start, end, hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage])

    useEffect(() => {
        return () => {
            stopListening()
        }
    }, [stopListening])

    if (isLoading || !data) {
        return (
            <div className='flex h-full max-h-screen flex-1 flex-col gap-2 justify-end-safe overflow-y-auto rounded-xl p-4'>
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
            <div className='flex h-full max-h-screen flex-1 flex-col gap-2 justify-end-safe overflow-y-auto rounded-xl p-4'>
                <p className='text-muted-foreground text-center'>Say hello to start a conversation.</p>
            </div>
        )
    }

    return (
        <MessageScrollerContent className='justify-end gap-2 py-4 px-2'>
            {isFetchingPreviousPage && <p className='text-center text-muted-foreground py-2'>Loading...</p>}

            {data.pages.map((message, index, messages) => (
                <Fragment key={message.id}>
                    {((index !== 0 && areSameDate(message.date, messages[index - 1].date)) || (!index && !hasPreviousPage)) && (
                        <MessageScrollerItem>
                            <Marker variant='separator'>
                                <MarkerContent>{getDateLabel(message.date)}</MarkerContent>
                            </Marker>
                        </MessageScrollerItem>
                    )}

                    <MessageModel message={message} />
                </Fragment>
            ))}
        </MessageScrollerContent>
    )
}
