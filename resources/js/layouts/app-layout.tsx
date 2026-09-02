import { router } from '@inertiajs/react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type CSSProperties, useEffect } from 'react'
import { toast, Toaster } from 'sonner'

import AppSidebar from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppearance } from '@/hooks/use-appearance'
import { useCurrentUrl } from '@/hooks/use-current-url'
import type { FlashToast } from '@/types'
import { Chat } from '@/types/models'

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
        router.on('navigate', () => {
            toast.dismiss()
        })

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
                    offset={currentUrl === '/settings' ? undefined : { top: '84px', right: '0' }}
                    mobileOffset={currentUrl === '/settings' ? undefined : { top: '84px', right: '0' }}
                    richColors
                    toastOptions={{
                        className: 'py-2!',
                    }}
                    style={
                        {
                            '--width': currentUrl === '/settings' ? '356px' : '100%',
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
    const queryClient = useQueryClient()

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
