import { Link, usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { ChevronsUpDown } from 'lucide-react'

import AppLogo from '@/components/app-logo'
import Contact from '@/components/contact'
import Photo from '@/components/photo'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { UserMenuContent } from '@/components/user-menu-content'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Chat } from '@/types/models'

export default function AppSidebar() {
    const { name, auth } = usePage().props
    const { state, setOpenMobile } = useSidebar()
    const isMobile = useIsMobile()

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

            {!!auth.user && (
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size='lg'
                                        className='group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                                        data-test='sidebar-menu-button'
                                    >
                                        <Photo
                                            src={auth.user.image_url as string}
                                            alt={auth.user.name}
                                            className='size-8'
                                            skeletonClassName='size-8'
                                        />
                                        <div className='grid flex-1 text-left text-sm leading-tight'>
                                            <span className='truncate font-medium'>{auth.user.name}</span>
                                            <span className='truncate text-xs text-muted-foreground'>
                                                {auth.user.username}
                                            </span>
                                        </div>

                                        <ChevronsUpDown className='ml-auto size-4' />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                                    align='end'
                                    side={isMobile ? 'bottom' : (state === 'collapsed' ? 'left' : 'bottom')}
                                >
                                    <UserMenuContent />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            )}
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
