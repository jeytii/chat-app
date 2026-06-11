import { Link, usePage } from '@inertiajs/react'
import { EllipsisVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain() {
    const { props } = usePage()

    return (
        <SidebarGroup className='px-2 py-0'>
            <div className='my-1'>
                <Input placeholder='Search contact...' className='text-xs' />
            </div>
            <SidebarGroupLabel>Contacts</SidebarGroupLabel>
            <SidebarMenu className='gap-2'>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        size='lg'
                        isActive={props.conversationId === 1}
                        className='data-[active=false]:hover:bg-transparent data-[active=false]:hover:text-sidebar-foreground'
                    >
                        <Link href='/?id=1' replace>
                            <div className='relative'>
                                <Avatar className='size-9 rounded-full border border-primary'>
                                    <AvatarImage src='https://placehold.co/50x50' />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <span className='absolute bottom-px right-px size-2.5 bg-green-700 border border-primary rounded-full' />
                            </div>
                            <div>
                                <h5>John Doe</h5>
                                <p className='text-xs text-muted-foreground'>Lorem ipsum</p>
                            </div>
                        </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover className='top-1/2! right-2 -translate-y-1/2 cursor-pointer hover:bg-transparent'>
                        <EllipsisVertical />
                    </SidebarMenuAction>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        size='lg'
                        isActive={props.conversationId === 2}
                        className='data-[active=false]:hover:bg-transparent data-[active=false]:hover:text-sidebar-foreground'
                    >
                        <Link href='/?id=2' replace>
                            <div className='relative'>
                                <Avatar className='size-9 rounded-full border border-primary'>
                                    <AvatarImage src='https://placehold.co/50x50' />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <span className='absolute bottom-px right-px size-2.5 bg-green-700 border border-primary rounded-full' />
                            </div>
                            <div>
                                <h5>Juan Dela Cruz</h5>
                                <p className='text-xs text-muted-foreground'>Lorem ipsum</p>
                            </div>
                        </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover className='top-1/2! right-2 -translate-y-1/2 cursor-pointer hover:bg-transparent'>
                        <EllipsisVertical />
                    </SidebarMenuAction>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    )
}
