import { usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'

import MessageBox from '@/components/message-box'
import Messages, { Placeholder as MessagesPlaceholder } from '@/components/messages'
import Photo from '@/components/photo'
import PresenceIndicator from '@/components/presence-indicator'
import { MessageScroller, MessageScrollerButton, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Chat as ChatModel } from '@/types/models'

export default function Chat() {
    const id = usePage<{ chat_id: number }>().props.chat_id
    const { data, isLoading } = useQuery<ChatModel[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
    })

    const user = data?.find(user => user.id === id)?.user

    if (isLoading || !user) {
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
        <MessageScrollerProvider scrollEdgeThreshold={100} autoScroll>
            {/* ===== HEADER ===== */}
            <header className='z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 dark:border-input/60'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='-ml-1' />

                    <div className='flex items-center gap-2'>
                        <Photo src={user.image_url as string} alt={user.name} />
                        <div>
                            <h1>{user.name}</h1>
                            <PresenceIndicator chatId={id} isOnline={user.is_online} />
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== MESSAGES ===== */}
            <MessageScroller>
                <MessageScrollerViewport className='data-autoscrolling:scrollbar-thin'>
                    <Messages />
                </MessageScrollerViewport>
                <MessageScrollerButton />
            </MessageScroller>

            {/* ===== MESSAGE BOX ===== */}
            <MessageBox />
        </MessageScrollerProvider>
    )
}
