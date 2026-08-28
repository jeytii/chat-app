import { Link, usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'

import AppLogo from '@/components/app-logo'
import Contact from '@/components/contact'
import { NavUser } from '@/components/nav-user'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Chat } from '@/types/models'

export default function AppSidebar() {
    const { name } = usePage().props
    const { setOpenMobile } = useSidebar()

    const { data, isLoading } = useQuery<Chat[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
    })

    return (
        <Sidebar collapsible='icon' variant='inset' className='px-0!'>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' asChild>
                            <Link
                                href='/'
                                replace
                                className='gap-3'
                                onClick={setOpenMobile.bind(null, false)}
                            >
                                <AppLogo className='size-6!' />
                                <h1 className='truncate text-sm leading-tight font-semibold'>{name}</h1>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className='px-2 py-0'>
                    <SidebarGroupLabel>Contacts</SidebarGroupLabel>

                    {(isLoading || !data) ? (
                        <Placeholder />
                    ) : (
                        <SidebarMenu className='gap-2'>
                            {data.map(contact => <Contact key={contact.id} chat={contact} />)}
                        </SidebarMenu>
                    )}
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}

function Placeholder() {
    return (
        <div className='space-y-4 px-2'>
            <div className='flex items-center gap-2'>
                <Skeleton className='size-10 rounded-full' />
                <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-1/2' />
                </div>
            </div>
            <div className='flex items-center gap-2'>
                <Skeleton className='size-10 rounded-full' />
                <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-1/2' />
                </div>
            </div>
            <div className='flex items-center gap-2'>
                <Skeleton className='size-10 rounded-full' />
                <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-1/2' />
                </div>
            </div>
            <div className='flex items-center gap-2'>
                <Skeleton className='size-10 rounded-full' />
                <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-1/2' />
                </div>
            </div>
            <div className='flex items-center gap-2'>
                <Skeleton className='size-10 rounded-full' />
                <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-1/2' />
                </div>
            </div>
        </div>
    )
}
