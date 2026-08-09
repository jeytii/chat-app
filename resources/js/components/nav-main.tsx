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
import type { Chat } from '@/types/models'

export function NavMain() {
    const chatId = usePage<{ chat_id?: number; }>().props.chat_id

    const { data, isLoading } = useQuery<Chat[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
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
                    {data.map(chat => (
                        <SidebarMenuItem key={chat.id}>
                            <SidebarMenuButton
                                asChild
                                size='lg'
                                isActive={chatId === chat.id}
                                className='data-[active=false]:hover:bg-transparent data-[active=false]:hover:text-sidebar-foreground'
                            >
                                <Link href={`/chats/${chat.id}`} replace>
                                    <div className='relative'>
                                        <Photo src={chat.user.image_url as string} />

                                        {chat.user.is_online && (
                                            <span className='absolute right-px bottom-px size-2.5 rounded-full border border-primary bg-green-700' />
                                        )}
                                    </div>
                                    <div className='overflow-hidden'>
                                        <h5 className='truncate'>{chat.user.name}</h5>
                                        <p className='truncate text-xs text-muted-foreground'>{chat.user.username}</p>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                            {chat.has_new_message && (
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
