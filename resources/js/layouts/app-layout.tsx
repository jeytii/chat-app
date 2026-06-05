import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppContent } from '@/components/app-content'
import { AppShell } from '@/components/app-shell'
import { AppSidebar } from '@/components/app-sidebar'
import { AppSidebarHeader } from '@/components/app-sidebar-header'

const queryClient = new QueryClient()

export default function AppLayout({ children }: { children: React.ReactNode; }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AppShell variant='sidebar'>
                <AppSidebar />
                <AppContent variant='sidebar' className='overflow-x-hidden'>
                    <AppSidebarHeader />
                    {children}
                </AppContent>
            </AppShell>

            <ReactQueryDevtools position='right' />
        </QueryClientProvider>
    )
}
