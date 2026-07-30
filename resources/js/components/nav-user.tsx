import { usePage } from '@inertiajs/react'
import { ChevronsUpDown } from 'lucide-react'

import Photo from '@/components/photo'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import { UserMenuContent } from '@/components/user-menu-content'
import { useIsMobile } from '@/hooks/use-mobile'

export function NavUser() {
    const { user } = usePage().props.auth
    const { state } = useSidebar()
    const isMobile = useIsMobile()

    if (!user) {
        return null
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            className='group data-[state=open]:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent'
                            data-test='sidebar-menu-button'
                        >
                            <Photo src={user.image_url as string} size={32} className='size-8 rounded-full' />
                            <div className='grid flex-1 text-left text-sm leading-tight'>
                                <span className='truncate font-medium'>{user.name}</span>
                                <span className='truncate text-xs text-muted-foreground'>
                                    {user.username}
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
    )
}
