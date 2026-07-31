import { Link, usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'

import Photo from '@/components/photo'
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
            <SidebarGroupLabel>Contacts</SidebarGroupLabel>

            {isLoading && (
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
                                        <Photo
                                            src={conversation.user.image_url as string}
                                            size={40}
                                            className='size-10 rounded-full'
                                        />
                                        {conversation.user.is_online && (
                                            <span className='absolute right-px bottom-px size-2.5 rounded-full border border-primary bg-green-700' />
                                        )}
                                    </div>
                                    <div className='overflow-hidden'>
                                        <h5 className='truncate'>{conversation.user.name}</h5>
                                        <p className='truncate text-xs text-muted-foreground'>{conversation.user.username}</p>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                            {conversation.has_new_message && (
                                <SidebarMenuAction className='top-1/2! w-auto -translate-y-1/2'>
                                    <div className='size-2 rounded-full bg-primary' />
                                </SidebarMenuAction>
                            )}
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            )}
        </SidebarGroup>
    )
}
