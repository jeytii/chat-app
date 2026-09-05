import { router, usePage } from '@inertiajs/react'
import { type InfiniteData, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type CSSProperties, useEffect } from 'react'
import { toast, Toaster } from 'sonner'

import AppSidebar from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppearance } from '@/hooks/use-appearance'
import { useCurrentUrl } from '@/hooks/use-current-url'
import type { FlashToast } from '@/types'
import type { Chat, Notification, NotificationResponse, User } from '@/types/models'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
})

export default function AppLayout({ children }: { children: React.ReactNode; }) {
    const { currentUrl } = useCurrentUrl()
    const { appearance } = useAppearance()

    useEffect(() => {
        router.on('flash', event => {
            const flash = (event as CustomEvent).detail?.flash
            const data = flash?.toast as FlashToast | undefined

            if (!data) {
                return
            }

            toast[data.type](data.message)
        })
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider delayDuration={0}>
                <Main currentUrl={currentUrl}>{children}</Main>

                <Toaster
                    theme={appearance}
                    className='toaster group'
                    position='top-right'
                    icons={{
                        loading: null,
                        info: null,
                        success: null,
                        error: null,
                    }}
                    visibleToasts={1}
                    richColors
                    toastOptions={{
                        className: 'py-2!',
                    }}
                    style={
                        {
                            '--normal-bg': 'var(--popover)',
                            '--normal-text': 'var(--popover-foreground)',
                            '--normal-border': 'var(--border)',
                        } as CSSProperties
                    }
                />
            </TooltipProvider>

            {import.meta.env.MODE !== 'staging' && (
                <ReactQueryDevtools position='right' buttonPosition='bottom-left' />
            )}
        </QueryClientProvider>
    )
}

function Main({ currentUrl, children }: { currentUrl: string, children: React.ReactNode }) {
    const { user } = usePage().props.auth
    const queryClient = useQueryClient()

    useEffect(() => {
        window.Echo.private(`App.Models.User.${user.id}`)
            .notification((notification: Notification & { user_id: string }) => {
                const newNotification = {
                    id: notification.id,
                    name: notification.name,
                    image_url: notification.image_url,
                    tab: notification.tab,
                    read_at: null,
                }

                router.replaceProp('auth.has_new_notifications', true)

                queryClient.setQueryData<InfiniteData<NotificationResponse>>(['notifications'], current => {
                    if (!current) {
                        return current
                    }

                    // Insert new item into a new page if the latest one has reached the pagination count
                    if (current.pages[0].items.length >= 10) {
                        return {
                            pageParams: [null, ...current.pageParams],
                            pages: [...current.pages, {
                                items: [newNotification],
                                next_cursor: null,
                            }],
                        }
                    }

                    // Else, push it into the latest page
                    return {
                        ...current,
                        pages: current.pages.map((page, index) => (
                            index ? page : { ...page, items: [newNotification, ...page.items] }
                        )),
                    }
                })

                if (['received-requests', 'sent-requests'].includes(notification.tab || 'chats')) {
                    queryClient.setQueryData<Pick<User, 'id' | 'name' | 'image_url'>[]>([notification.tab], current => {
                        if (!current) {
                            return current
                        }

                        return [
                            {
                                id: notification.user_id,
                                name: notification.name,
                                image_url: notification.image_url,
                            },
                            ...current,
                        ]
                    })
                }
            })

        return () => {
            window.Echo.leave(`App.Models.User.${user.id}`)
        }
    }, [user.id, queryClient])

    useEffect(() => {
        window.Echo.join('online')
            .here((emails: string[]) => {
                queryClient.setQueryData<Chat[]>(['chats'], current => (
                    !current ? current : current.map(chat => ({
                        ...chat,
                        is_online: !!emails.find(email => chat.user.email === email),
                    }))
                ))
            })
            .joining((email: string) => {
                queryClient.setQueryData<Chat[]>(['chats'], current => (
                    !current ? current : current.map(chat => ({
                        ...chat,
                        is_online: chat.user.email === email ? true : chat.is_online,
                    }))
                ))
            })
            .leaving((email: string) => {
                queryClient.setQueryData<Chat[]>(['chats'], current => (
                    !current ? current : current.map(chat => ({
                        ...chat,
                        is_online: chat.user.email === email ? false : chat.is_online,
                    }))
                ))
            })

        return () => {
            window.Echo.leave('online')
        }
    }, [queryClient])

    return (
        <SidebarProvider>
            {currentUrl !== '/' && <AppSidebar />}

            <SidebarInset className={currentUrl.startsWith('/chats') ? 'h-svh md:h-[calc(100svh-16px)]' : 'min-h-svh'}>
                {currentUrl === '/settings'
                    ? (
                        <section className='max-w-2xl space-y-4 p-4'>
                            {children}
                        </section>
                    )
                    : children
                }
            </SidebarInset>
        </SidebarProvider>
    )
}
