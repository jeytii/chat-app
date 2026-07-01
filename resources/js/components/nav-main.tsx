import { Link, usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { EllipsisVertical } from 'lucide-react'
import { DefaultPhoto, Photo } from '@/components/photo'
import { Input } from '@/components/ui/input'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Conversation } from '@/types/models'

export function NavMain() {
    const { props } = usePage<{ conversation?: Conversation; }>()

    const { data, isLoading } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: async () => (await fetch('/conversations')).json(),
    })

    return (
        <SidebarGroup className='px-2 py-0'>
            <div className='my-1'>
                <Input placeholder='Search contact...' className='text-xs' />
            </div>
            <SidebarGroupLabel>Contacts</SidebarGroupLabel>

            {isLoading && (
                <div className='px-2 space-y-4'>
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
            )}

            {!!data && (
                <SidebarMenu className='gap-2'>
                    {data.map(conversation => (
                        <SidebarMenuItem key={conversation.id}>
                            <SidebarMenuButton
                                asChild
                                size='lg'
                                isActive={props.conversation?.id === conversation.id}
                                className='data-[active=false]:hover:bg-transparent data-[active=false]:hover:text-sidebar-foreground'
                            >
                                <Link href={`/conversations/${conversation.id}`} replace>
                                    <div className='relative'>
                                        {conversation.user.image_url ? (
                                            <Photo
                                                src={conversation.user.image_url}
                                                className='rounded-full border border-primary'
                                            />
                                        ) : (
                                            <DefaultPhoto
                                                width={40}
                                                height={40}
                                                className='rounded-full border-2 border-primary fill-secondary'
                                            />
                                        )}
                                        <span className='absolute bottom-px right-px size-2.5 bg-green-700 border border-primary rounded-full' />
                                    </div>
                                    <div>
                                        <h5>{conversation.user.name}</h5>
                                        <p className='text-xs text-muted-foreground'>Lorem ipsum</p>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                            <SidebarMenuAction showOnHover className='top-1/2! right-2 -translate-y-1/2 cursor-pointer hover:bg-transparent'>
                                <EllipsisVertical />
                            </SidebarMenuAction>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            )}
        </SidebarGroup>
    )
}
