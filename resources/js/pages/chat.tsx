import { Head, usePage } from '@inertiajs/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ConnectionStatus } from 'laravel-echo'
import { useEffect, useRef, useState } from 'react'

import MessageBox from '@/components/message-box'
import Messages, { Placeholder as MessagesPlaceholder } from '@/components/messages'
import Photo from '@/components/photo'
import PresenceIndicator from '@/components/presence-indicator'
import { MessageScroller, MessageScrollerButton, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Chat as ChatType } from '@/types/models'


export default function Chat() {
    const id = usePage<{ chat_id: string }>().props.chat_id
    const queryClient = useQueryClient()
    const onlineIds = useRef<string[]>([])
    const [toast, setToast] = useState<{ status: ConnectionStatus; message: string; } | null>(null)
    const [isViewing, setIsViewing] = useState<boolean>(() => (
        typeof document === 'undefined' ? true : document.visibilityState === 'visible'
    ))

    const { data, isLoading } = useQuery<ChatType[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
    })

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
            const isVisible = document.visibilityState === 'visible'

            if (isVisible) {
                markMessagesAsSeen()
            }

            setIsViewing(isVisible)
        }

        const setConnectionStatus = (status: ConnectionStatus) => {
            if (status === 'failed') {
                setToast({
                    status,
                    message: 'Connection failed.',
                })
            } else if (status === 'connecting' || status === 'reconnecting') {
                setToast({
                    status,
                    message: 'Reconnecting...',
                })
            } else {
                setToast(null)
            }
        }

        markMessagesAsSeen()

        setConnectionStatus(window.Echo.connectionStatus())

        window.Echo.connector.onConnectionChange(setConnectionStatus)

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [id, queryClient])

    if (isLoading || !data) {
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

    const chat = data.find(chat => chat.id === id) as ChatType

    return (
        <>
            <Head title={
                !isViewing && chat && chat.has_new_message
                    ? `${chat.user.name} sent a message...`
                    : undefined
            } />

            <MessageScrollerProvider scrollEdgeThreshold={200} autoScroll>
                {/* ===== HEADER ===== */}
                <header className='relative z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 dark:border-input/60'>
                    <div className='flex items-center gap-2'>
                        <SidebarTrigger className='-ml-1' />

                        <div className='flex items-center gap-2'>
                            <Photo src={chat.user.image_url as string} alt={chat.user.name} />
                            <div>
                                <h1>{chat.user.name}</h1>
                                <PresenceIndicator chatId={id} isOnline={chat.is_online} />
                            </div>
                        </div>
                    </div>

                    {!!toast && (
                        <div className='absolute inset-x-0 top-full z-5 p-4'>
                            <div className={cn(
                                'mx-auto w-fit rounded-sm border bg-background',
                                {
                                    'border-border/70': ['connecting', 'reconnecting'].includes(toast.status),
                                    'border-destructive/50': toast.status === 'failed',
                                },
                            )}>
                                <h1 className={cn(
                                    'rounded-sm px-4 py-2 text-sm',
                                    {
                                        'text-foreground/80': ['connecting', 'reconnecting'].includes(toast.status),
                                        'bg-destructive/20 text-destructive-foreground/80': toast.status === 'failed',
                                    },
                                )}>
                                    {toast.message}
                                </h1>
                            </div>
                        </div>
                    )}
                </header>

                {/* ===== MESSAGES ===== */}
                <MessageScroller>
                    <MessageScrollerViewport className='data-autoscrolling:scrollbar-thin'>
                        <Messages onlineIds={onlineIds} isViewing={isViewing} />
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                </MessageScroller>

                {/* ===== MESSAGE BOX ===== */}
                <MessageBox onlineIds={onlineIds} setToast={setToast} />
            </MessageScrollerProvider>
        </>
    )
}
