import { usePage } from '@inertiajs/react'
import { useEcho } from '@laravel/echo-react'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { differenceInMinutes, isSameDay } from 'date-fns'
import { Fragment, useEffect } from 'react'

import MessageModel from '@/components/message-model'
import { Marker, MarkerContent } from '@/components/ui/marker'
import { MessageScrollerContent, MessageScrollerItem, useMessageScrollerScrollable } from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import { getDateDiff, getTimeDiff } from '@/hooks/use-datetime'
import { useInsertMessage } from '@/hooks/use-insert-message'
import type { Message, MessageResponse } from '@/types/models'

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
    const conversationId = usePage<{ conversation_id: number }>().props.conversation_id

    const { data, isLoading, fetchPreviousPage, isFetchingPreviousPage, hasPreviousPage } = useInfiniteQuery<
        MessageResponse,
        Error,
        InfiniteData<Message>,
        readonly unknown[],
        string | null
    >({
        queryKey: ['messages', conversationId],
        queryFn: ({ pageParam, signal }) => getMessages(pageParam, conversationId, signal),
        initialPageParam: null,
        getPreviousPageParam: lastPage => lastPage.next_cursor,
        getNextPageParam: () => null,
        select: data => ({
            ...data,
            pages: data.pages
                .flatMap(page => page.items)
                .map(message => ({
                    ...message,
                    date_diff: getDateDiff(message.date),
                    time_diff: getTimeDiff(message.date),
                })),
        }),
    })

    const queryClient = useQueryClient()
    const insertMessage = useInsertMessage()
    const { start, end } = useMessageScrollerScrollable()

    const { stopListening } = useEcho<Message>(`conversation.${conversationId}`, 'MessageSent', async message => {
        await queryClient.cancelQueries({ queryKey: ['messages', conversationId] })

        insertMessage(conversationId, message, true)

        await queryClient.invalidateQueries({
            queryKey: ['messages', conversationId],
            refetchType: 'none',
        })
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
        return <Placeholder />
    }

    if (!data.pages.length) {
        return (
            <div className='flex h-full max-h-screen flex-1 flex-col justify-end-safe gap-2 overflow-y-auto rounded-xl p-4'>
                <p className='text-center text-muted-foreground'>Say hello to start a conversation.</p>
            </div>
        )
    }

    return (
        <MessageScrollerContent className='justify-end gap-2 p-4'>
            {isFetchingPreviousPage && <p className='py-2 text-center text-muted-foreground'>Loading...</p>}

            {data.pages.map((message, index, messages) => (
                <Fragment key={message.id}>
                    {((index !== 0 && !isSameDay(message.date, messages[index - 1].date)) || (!index && !hasPreviousPage)) && (
                        <MessageScrollerItem>
                            <Marker variant='separator'>
                                <MarkerContent>{message.date_diff}</MarkerContent>
                            </Marker>
                        </MessageScrollerItem>
                    )}

                    <MessageModel
                        message={message}
                        firstInAMinute={
                            (
                                index !== 0 // is not the very first message
                                && differenceInMinutes(message.date, messages[index - 1].date) >= 1 // difference in minutes between current previous at least 1
                                && message.from_self === messages[index - 1].from_self // both current and previous messages have the same sender
                            )
                            || (!index && !hasPreviousPage) // is the very first message
                        }
                    />
                </Fragment>
            ))}
        </MessageScrollerContent>
    )
}

export function Placeholder() {
    return (
        <div className='flex h-full max-h-screen flex-1 flex-col justify-end-safe gap-2 overflow-y-auto rounded-xl p-4'>
            <div>
                <Skeleton className='ml-auto h-10 max-w-[10%]' />
            </div>
            <div>
                <Skeleton className='ml-auto h-10 max-w-[30%]' />
            </div>
            <Skeleton className='h-10 max-w-[70%]' />
            <Skeleton className='h-10 max-w-[20%]' />
            <div>
                <Skeleton className='ml-auto h-10 max-w-[40%]' />
            </div>
            <div>
                <Skeleton className='ml-auto h-10 max-w-[20%]' />
            </div>
            <div>
                <Skeleton className='ml-auto h-16 max-w-[70%]' />
            </div>
        </div>
    )
}
