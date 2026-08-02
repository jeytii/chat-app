import { usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'

import MessageBox from '@/components/message-box'
import Messages, { Placeholder as MessagesPlaceholder } from '@/components/messages'
import Photo from '@/components/photo'
import PresenceIndicator from '@/components/presence-indicator'
import { MessageScroller, MessageScrollerButton, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Conversation as ConversationModel } from '@/types/models'

export default function Conversation() {
    const id = usePage<{ conversation_id: number }>().props.conversation_id
    const { data, isLoading } = useQuery<ConversationModel[]>({
        queryKey: ['conversations'],
        queryFn: async () => (await fetch('/conversations')).json(),
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
        <MessageScrollerProvider scrollEdgeThreshold={100}>
            {/* ===== HEADER ===== */}
            <header className='z-10 flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='-ml-1' />

                    <div className='flex items-center gap-2'>
                        <Photo src={user.image_url as string} size={40} className='size-10 rounded-full' />
                        <div>
                            <h1>{user.name}</h1>
                            <PresenceIndicator conversationId={id} isOnline={user.is_online} />
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== MESSAGES ===== */}
            <MessageScroller>
                <MessageScrollerViewport>
                    <Messages />
                </MessageScrollerViewport>
                <MessageScrollerButton />
            </MessageScroller>

            {/* ===== MESSAGE BOX ===== */}
            <MessageBox />
        </MessageScrollerProvider>
    )
}
