import { usePage } from '@inertiajs/react'
import { useEcho } from '@laravel/echo-react'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Fragment, useEffect, useState } from 'react'

import MessageModel from '@/components/message-model'
import { Marker, MarkerContent } from '@/components/ui/marker'
import { MessageScrollerContent, MessageScrollerItem, useMessageScroller, useMessageScrollerScrollable } from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import { useInsertMessage } from '@/hooks/use-insert-message'
import { useDebounce } from '@/hooks/use-limit'
import { toReadableDate } from '@/lib/utils'
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

    return toReadableDate(givenDate, 'short')
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
    const { conversation, auth } = usePage<PageProps>().props
    const [typing, setTyping] = useState<boolean>(false)

    const { data, isLoading, fetchPreviousPage, isFetchingPreviousPage, hasPreviousPage } = useInfiniteQuery<
        MessageResponse,
        Error,
        InfiniteData<Message>,
        readonly unknown[],
        string | null
    >({
        queryKey: ['messages', conversation.id],
        queryFn: ({ pageParam, signal }) => getMessages(pageParam, conversation.id, signal),
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
    const { debouncedFn: typingDebouncedFn, stopTimeout: stopTypingDebouncedFn } = useDebounce(1000)

    const { stopListening, channel } = useEcho<Message>(`conversation.${conversation.id}`, 'MessageSent', async message => {
        await queryClient.cancelQueries({ queryKey: ['messages', conversation.id] })

        insertMessage(conversation.id, message, true)

        await queryClient.invalidateQueries({
            queryKey: ['messages', conversation.id],
            refetchType: 'none',
        })

        setTyping(false)

        stopTypingDebouncedFn()

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
        channel()?.listenForWhisper('typing', ({ username }) => {
            if (username !== auth.user.username) {
                setTyping(true)

                typingDebouncedFn(() => {
                    setTyping(false)
                })
            }
        })

        return () => {
            stopListening()
            channel()?.stopListeningForWhisper('typing')
        }
    }, [auth, channel, stopListening, typingDebouncedFn])

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

            {typing && (
                <MessageScrollerItem className='flex gap-1 items-end'>
                    <p className='text-xs text-muted-foreground'>Typing</p>
                    <div className='relative flex gap-1 bottom-1'>
                        <span className='block size-[3.5px] bg-secondary rounded-full animate-[blink_900ms_infinite_linear_300ms]' />
                        <span className='block size-[3.5px] bg-secondary rounded-full animate-[blink_900ms_infinite_linear_600ms]' />
                        <span className='block size-[3.5px] bg-secondary rounded-full animate-[blink_900ms_infinite_linear_900ms]' />
                    </div>
                </MessageScrollerItem>
            )}
        </MessageScrollerContent>
    )
}
