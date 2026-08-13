import { Head, usePage } from '@inertiajs/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type Dispatch, type SetStateAction, useEffect, useState } from 'react'

import MessageBox from '@/components/message-box'
import Messages, { Placeholder as MessagesPlaceholder } from '@/components/messages'
import Photo from '@/components/photo'
import PresenceIndicator from '@/components/presence-indicator'
import { MessageScroller, MessageScrollerButton, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Chat as ChatType } from '@/types/models'

type Context = {
    isViewing: boolean;
    onlineIds: number[];
    setOnlineIds: Dispatch<SetStateAction<number[]>>;
}

export const PresenceContext = createContext<Context>({
    isViewing: false,
    onlineIds: [],
    setOnlineIds: () => { },
})

export default function Chat() {
    const id = usePage<{ chat_id: number }>().props.chat_id
    const [onlineIds, setOnlineIds] = useState<number[]>([])
    const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => (
        typeof document === 'undefined' ? 'visible' : document.visibilityState
    ))
    const { data, isLoading } = useQuery<ChatType[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
    })
    const queryClient = useQueryClient()

    const chat = data?.find(chat => chat.id === id)

    useEffect(() => {
        const markMessagesAsSeen = () => {
            queryClient.setQueryData<ChatType[]>(['chats'], current => (
                !current ? current : current.map(chat => ({
                    ...chat,
                    has_new_message: chat.id === id ? false : chat.has_new_message,
                }))
            ))
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                markMessagesAsSeen()
            }

            setVisibilityState(document.visibilityState)
        }

        markMessagesAsSeen()

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [id, queryClient])

    if (isLoading || !chat?.user) {
        return (
            <div className='flex h-full flex-col'>
                <div className='flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4'>
                    <Skeleton className='size-10 rounded-full' />
                    <div className='space-y-2'>
                        <Skeleton className='h-4 w-60' />
                        <Skeleton className='h-4 w-10' />
                    </div>
                </div>

                <MessagesPlaceholder />
            </div>
        )
    }

    return (
        <>
            <Head title={
                visibilityState === 'hidden' && chat && chat.has_new_message
                    ? `${chat.user.name} sent a message...`
                    : undefined
            } />

            <MessageScrollerProvider scrollEdgeThreshold={200} autoScroll>
                {/* ===== HEADER ===== */}
                <header className='z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 dark:border-input/60'>
                    <div className='flex items-center gap-2'>
                        <SidebarTrigger className='-ml-1' />

                        <div className='flex items-center gap-2'>
                            <Photo src={chat.user.image_url as string} alt={chat.user.name} />
                            <div>
                                <h1>{chat.user.name}</h1>
                                <PresenceIndicator chatId={id} isOnline={chat.user.is_online} />
                            </div>
                        </div>
                    </div>
                </header>

                <PresenceContext value={{
                    isViewing: visibilityState === 'visible',
                    onlineIds,
                    setOnlineIds,
                }}>
                    {/* ===== MESSAGES ===== */}
                    <MessageScroller>
                        <MessageScrollerViewport className='data-autoscrolling:scrollbar-thin'>
                            <Messages />
                        </MessageScrollerViewport>
                        <MessageScrollerButton />
                    </MessageScroller>

                    {/* ===== MESSAGE BOX ===== */}
                    <MessageBox />
                </PresenceContext>
            </MessageScrollerProvider>
        </>
    )
}
