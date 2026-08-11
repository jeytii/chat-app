import { usePage } from '@inertiajs/react'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { differenceInMinutes, isSameDay } from 'date-fns'
import { CheckCheck } from 'lucide-react'
import { Fragment, useContext, useEffect } from 'react'

import MessageModel from '@/components/message-model'
import { PresenceContext } from '@/components/presence-provider'
import { Marker, MarkerContent } from '@/components/ui/marker'
import { Message } from '@/components/ui/message'
import { MessageScrollerContent, MessageScrollerItem, useMessageScrollerScrollable } from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import { getDateDiff, getTimeDiff } from '@/hooks/use-datetime'
import { useDebounce } from '@/hooks/use-limit'
import useMessage from '@/hooks/use-message'
import type { Message as MessageType, MessageResponse } from '@/types/models'

type MessageSentData = Omit<MessageType, 'from_self'> & {
    sender_id: number;
    seen: boolean;
}

async function getMessages(pageParam: string | null, chatId: number, signal: AbortSignal) {
    const { data } = await axios<MessageResponse>(`/chats/${chatId}/messages`, {
        params: { cursor: pageParam },
        signal,
    })

    return data
}

export default function Messages() {
    const { auth, chat_id: chatId } = usePage<{ chat_id: number }>().props
    const { setOnlineIds } = useContext(PresenceContext)

    const { data, isLoading, fetchPreviousPage, isFetchingPreviousPage, hasPreviousPage } = useInfiniteQuery<
        MessageResponse,
        Error,
        InfiniteData<MessageType>,
        readonly unknown[],
        string | null
    >({
        queryKey: ['messages', chatId],
        queryFn: ({ pageParam, signal }) => getMessages(pageParam, chatId, signal),
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
    const { insert, alter, remove } = useMessage()
    const { start, end } = useMessageScrollerScrollable()
    const { debounce } = useDebounce(1000)

    const lastItemIsFromSelf = data?.pages[data.pages.length - 1]?.from_self
    const allMessagesAreSeen = data?.pages
        .filter(message => message.from_self)
        .every(message => !!message.seen)

    useEffect(() => {
        const privateChannel = window.Echo.private(`chat.${chatId}`)
        const presenceChannel = window.Echo.join(`room.${chatId}`)

        setTimeout(() => {
            presenceChannel.whisper('new_message_sent', {
                id: auth.user.id,
            })
        }, 500)

        privateChannel
            .listen('.MessageSent', ({ sender_id: senderId, seen, ...message }: MessageSentData) => {
                insert(chatId, {
                    ...message,
                    from_self: senderId === auth.user.id,
                })

                if (seen) {
                    debounce(() => {
                        presenceChannel.whisper('new_message_sent', {})
                    })
                }
            })
            .listen('.MessageEdited', (message: MessageType) => {
                alter(chatId, message.id, message)
            })
            .listen('.MessageDeleted', (message: Pick<MessageType, 'id'>) => {
                remove(chatId, message.id)
            })

        presenceChannel
            .here((ids: number[]) => {
                setOnlineIds(ids)
            })
            .joining((id: number) => {
                setOnlineIds(current => ([
                    ...new Set([...current, id]),
                ]))
            })
            .leaving((id: number) => {
                setOnlineIds(current => current.filter(onlineId => onlineId !== id))
            })
            .listenForWhisper('new_message_sent', () => {
                queryClient.setQueryData<InfiniteData<MessageResponse>>(['messages', chatId], current => (
                    !current ? current : {
                        ...current,
                        pages: current.pages.map(page => ({
                            ...page,
                            items: page.items.map(item => ({
                                ...item,
                                seen: true,
                            })),
                        })),
                    }
                ))
            })

        return () => {
            privateChannel.stopListening('.MessageSent')
            privateChannel.stopListening('.MessageEdited')
            privateChannel.stopListening('.MessageDeleted')

            window.Echo.leave(`room.${chatId}`)
        }
    }, [chatId, auth.user.id, insert, alter, remove, setOnlineIds, queryClient, debounce])

    useEffect(() => {
        if (end && !start && hasPreviousPage && !isFetchingPreviousPage) {
            fetchPreviousPage()
        }
    }, [start, end, hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage])

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

                    <MessageScrollerItem>
                        <Message align={message.from_self ? 'end' : 'start'}>
                            <MessageModel
                                chatId={chatId}
                                message={message}
                                firstInAMinute={
                                    (
                                        index !== 0 // is not the very first message
                                        && (
                                            message.from_self !== messages[index - 1].from_self // both current and previous messages have the same sender
                                            || differenceInMinutes(message.date, messages[index - 1].date) >= 1 // difference in minutes between current previous at least 1
                                        )
                                    )
                                    || (!index && !hasPreviousPage) // is the very first message
                                }
                            />
                        </Message>
                    </MessageScrollerItem>
                </Fragment>
            ))}

            {(allMessagesAreSeen && lastItemIsFromSelf) && (
                <p className='flex items-center justify-end gap-1 text-xs text-green-400'>
                    <CheckCheck size={14} />
                    <span>Seen</span>
                </p>
            )}
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
