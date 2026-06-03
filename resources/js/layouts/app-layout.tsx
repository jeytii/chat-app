import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'
import type { BreadcrumbItem } from '@/types'

const queryClient = new QueryClient()

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <QueryClientProvider client={queryClient}>
            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                {children}
            </AppLayoutTemplate>

            <ReactQueryDevtools position='right' />
        </QueryClientProvider>
    )
}
