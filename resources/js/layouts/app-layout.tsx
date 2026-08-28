import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'

import AppSidebar from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useCurrentUrl } from '@/hooks/use-current-url'
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
    return (
        <QueryClientProvider client={queryClient}>
            <Main>{children}</Main>

            {import.meta.env.MODE !== 'staging' && (
                <ReactQueryDevtools position='right' buttonPosition='bottom-left' />
            )}
        </QueryClientProvider>
    )
}

function Main({ children }: { children: React.ReactNode }) {
    const { currentUrl } = useCurrentUrl()
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
