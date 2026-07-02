import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useCurrentUrl } from '@/hooks/use-current-url'
import { cn } from '@/lib/utils'

const queryClient = new QueryClient()

export default function AppLayout({ children }: { children: React.ReactNode; }) {
    const { currentUrl } = useCurrentUrl()

    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className={cn(
                    currentUrl.startsWith('/conversations') ? 'h-[calc(100vh-16px)]' : 'min-h-svh',
                )}>
                    {children}
                </SidebarInset>
            </SidebarProvider>

            <ReactQueryDevtools position='right' />
        </QueryClientProvider>
    )
}
