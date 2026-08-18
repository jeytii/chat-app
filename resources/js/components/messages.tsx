import { usePage } from '@inertiajs/react'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { differenceInMinutes, isSameDay } from 'date-fns'
import { CheckCheck } from 'lucide-react'
import { Fragment, useContext, useEffect, useRef } from 'react'

import { ChatContext } from '@/components/chat-provider'
import MessageModel from '@/components/message-model'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import { Message } from '@/components/ui/message'
import { MessageScrollerContent, MessageScrollerItem, useMessageScrollerScrollable } from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import { getDateDiff, getTimeDiff } from '@/hooks/use-datetime'
import { useDebounce } from '@/hooks/use-limit'
import useMessage from '@/hooks/use-message'
import type { Chat, Message as MessageType, MessageResponse, Reaction } from '@/types/models'

type MessageSentData = Omit<MessageType, 'from_self'> & {
    chat_id: string;
    sender_email: string;
    seen: boolean;
}

async function getMessages(pageParam: string | null, chatId: string, signal: AbortSignal) {
    const { data } = await axios<MessageResponse>(`/chats/${chatId}/messages`, {
        params: { cursor: pageParam },
        signal,
    })

    return data
}

export default function Messages() {
    const { auth, chat_id: chatId } = usePage<{ chat_id: string }>().props
    const { isViewing, onlineIds } = useContext(ChatContext)

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
    const { debounce } = useDebounce(500)

    const insertRef = useRef<(chatId: string, message: MessageType) => void>(insert)
    const alterRef = useRef<(chatId: string, id: string, newData: Partial<MessageType>) => void>(alter)
    const removeRef = useRef<(chatId: string, id: string) => void>(remove)
    const isViewingRef = useRef<boolean>(isViewing)

    const lastItemIsFromSelf = data?.pages[data.pages.length - 1]?.from_self
    const allMessagesAreSeen = data?.pages
        .filter(message => message.from_self)
        .every(message => !!message.seen)

    useEffect(() => {
        insertRef.current = insert
        alterRef.current = alter
        removeRef.current = remove
        isViewingRef.current = isViewing
    })

    useEffect(() => {
        const presenceChannel = window.Echo.join(`room.${chatId}`)

        const manageReactions = (reactions: Reaction[], payload: Omit<Reaction, 'has_reacted'>) => {
            // Remove reaction if total is 0
            if (!payload.total) {
                return reactions.filter(reaction => reaction.name !== payload.name)
            }

            // Edit reaction if it already exists in the list
            if (reactions.findIndex(reaction => reaction.name === payload.name) !== -1) {
                return reactions.map(reaction => (
                    reaction.name === payload.name
                        ? { ...reaction, ...payload }
                        : reaction
                ))
            }

            // Else, append new reaction
            return [
                ...reactions,
                { ...payload, has_reacted: false },
            ]
        }

        setTimeout(() => {
            presenceChannel.whisper('seen', {})
        }, 500)

        presenceChannel
            .here((ids: string[]) => {
                onlineIds.current = ids
            })
            .joining((id: string) => {
                onlineIds.current = [...onlineIds.current, id]
            })
            .leaving((id: string) => {
                onlineIds.current = onlineIds.current.filter(onlineId => onlineId !== id)
            })
            .listen('.MessageSent', ({ sender_email: senderEmail, chat_id: contactId, seen, ...message }: MessageSentData) => {
                insertRef.current(chatId, {
                    ...message,
                    from_self: senderEmail === auth.user.email,
                    seen,
                })

                if (!isViewingRef.current) {
                    queryClient.setQueryData<Chat[]>(['chats'], current => (
                        !current ? current : current.map(chat => ({
                            ...chat,
                            has_new_message: chat.id === chatId ? true : chat.has_new_message,
                        }))
                    ))
                }

                if (seen) {
                    debounce(() => {
                        presenceChannel.whisper('seen', {
                            chat_id: contactId,
                        })
                    })
                }
            })
            .listen('.MessageEdited', (message: MessageType) => {
                alterRef.current(chatId, message.id, message)
            })
            .listen('.MessageDeleted', (message: Pick<MessageType, 'id'>) => {
                removeRef.current(chatId, message.id)
            })
            .listen('MessageReaction', (payload: { message_id: string; reaction: Omit<Reaction, 'has_reacted'> }) => {
                const message = queryClient.getQueryData<InfiniteData<MessageResponse>>(['messages', chatId])
                    ?.pages
                    .flatMap(page => page.items)
                    .find(message => message.id === payload.message_id) as MessageType

                alterRef.current(chatId, payload.message_id, {
                    reactions: manageReactions(message.reactions, payload.reaction),
                })
            })
            .listenForWhisper('seen', () => {
                queryClient.setQueryData<InfiniteData<MessageResponse>>(['messages', chatId], current => (
                    !current ? current : {
                        ...current,
                        pages: current.pages.map((page, index, pages) => {
                            if (index < (pages.length - 2)) {
                                return page
                            }

                            return {
                                ...page,
                                items: page.items.map(item => ({
                                    ...item,
                                    seen: item.from_self ? true : item.seen,
                                })),
                            }
                        }),
                    }
                ))
            })

        return () => {
            window.Echo.leave(`room.${chatId}`)
        }
    }, [chatId, auth.user.email, onlineIds, queryClient, debounce])

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
                        <Marker variant='separator'>
                            <MarkerContent>{message.date_diff}</MarkerContent>
                        </Marker>
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
                <Marker className='justify-end px-1 text-xs text-green-400'>
                    <MarkerIcon>
                        <CheckCheck size={14} />
                    </MarkerIcon>
                    <MarkerContent>Seen</MarkerContent>
                </Marker>
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
