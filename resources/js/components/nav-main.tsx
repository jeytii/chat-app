import { Link } from '@inertiajs/react'
import { EllipsisVertical } from 'lucide-react'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useCurrentUrl } from '@/hooks/use-current-url'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Input } from './ui/input'

export function NavMain() {
    const { isCurrentUrl } = useCurrentUrl()

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
                        isActive={isCurrentUrl('/')}
                    >
                        <Link href='/' prefetch>
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
                    <SidebarMenuAction showOnHover>
                        <EllipsisVertical />
                    </SidebarMenuAction>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        size='lg'
                        isActive={isCurrentUrl('/about')}
                    >
                        <Link href='/about' prefetch>
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
                    <SidebarMenuAction showOnHover>
                        <EllipsisVertical />
                    </SidebarMenuAction>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    )
}
