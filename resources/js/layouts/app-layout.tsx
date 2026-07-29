import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useCurrentUrl } from '@/hooks/use-current-url'

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

    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className={currentUrl.startsWith('/conversations') ? 'h-svh md:h-[calc(100svh-16px)]' : 'min-h-svh'}>
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

            <ReactQueryDevtools position='right' />
        </QueryClientProvider>
    )
}
