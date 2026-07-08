import { usePage } from '@inertiajs/react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import MessageBox from '@/components/message-box'
import Messages from '@/components/messages'
import { DefaultPhoto } from '@/components/photo'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Conversation as ConversationModel } from '@/types/models'

type PageProps = {
    conversation: { id: number; }
}

export default function Conversation() {
    const { id } = usePage<PageProps>().props.conversation
    const queryClient = useQueryClient()
    const isFetchingConversations = useIsFetching({ queryKey: ['conversations'] })

    const user = useMemo(() => {
        if (isFetchingConversations) {
            return null
        }

        const conversations = queryClient.getQueryData<ConversationModel[]>(['conversations'])

        if (!conversations) {
            return null
        }

        return conversations.find(conversation => conversation.id === id)?.user || null
    }, [queryClient, id, isFetchingConversations])

    return (
        <>
            {/* ===== HEADER ===== */}
            <header className='flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 z-10 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='-ml-1' />

                    {user ? (
                        <DefaultPhoto width={40} height={40} />
                    ) : (
                        <Skeleton className='size-10 rounded-full' />
                    )}

                    {user ? (
                        <div>
                            <h1>{user.name}</h1>
                            {user.is_online ? (
                                <p className='text-xs text-green-600 dark:text-green-400'>Online</p>
                            ) : (
                                <p className='text-xs text-muted-foreground'>Offline</p>
                            )}
                        </div>
                    ) : (
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-60' />
                            <Skeleton className='h-4 w-10' />
                        </div>
                    )}
                </div>
            </header>

            {/* ===== MESSAGES ===== */}
            <Messages />

            {/* ===== MESSAGE BOX ===== */}
            <MessageBox />
        </>
    )
}
