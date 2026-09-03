import { Link, router, usePage } from '@inertiajs/react'
import { type InfiniteData, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Bell } from 'lucide-react'
import { useMemo } from 'react'

import AppLogo from '@/components/app-logo'
import Contact from '@/components/contact'
import Photo from '@/components/photo'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { UserMenuContent } from '@/components/user-menu-content'
import useNotifications from '@/hooks/use-notifications'
import type { Chat, NotificationResponse } from '@/types/models'

export default function Home() {
    const { name, auth } = usePage().props
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery<Chat[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
    })

    const { data: notifications } = useNotifications()

    const hasNewNotifications = useMemo<boolean>(
        () => notifications?.pages.some(notification => !notification.read_at) || auth.has_new_notifications,
        [auth.has_new_notifications, notifications],
    )

    function markNotificationsAsRead() {
        queryClient.setQueryData<InfiniteData<NotificationResponse>>(['notifications'], current => {
            if (!current) {
                return current
            }

            return {
                ...current,
                pages: current.pages.map(page => ({
                    ...page,
                    items: page.items.map(item => (
                        item.read_at ? item : {
                            ...item,
                            read_at: new Date().toDateString(),
                        }
                    )),
                })),
            }
        })

        router.replaceProp('auth.has_new_notifications', false)

        axios.post('/notifications')
    }

    function toggleNotifications(open: boolean) {
        if (open && hasNewNotifications) {
            markNotificationsAsRead()
        }
    }

    return (
        <div>
            <header className='mx-auto flex max-w-2xl items-center gap-4 py-2 pr-4 pl-2'>
                <Link href='/' className='inline-flex h-12 items-center gap-3 p-2'>
                    <AppLogo className='size-6!' />
                    <h1 className='truncate text-sm leading-tight font-semibold'>{name}</h1>
                </Link>

                <DropdownMenu onOpenChange={toggleNotifications}>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon-sm' className='relative ml-auto'>
                            <Bell />
                            {hasNewNotifications && (
                                <div className='absolute top-1 right-2 size-2 rounded-full bg-destructive' />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='max-h-92.5 max-w-70 min-w-56 divide-y! overflow-y-auto! rounded-md sm:max-w-90'
                        align='end'
                        sideOffset={16}
                    >
                        {!notifications?.pages.length ? (
                            <DropdownMenuItem className='rounded-none p-3! hover:bg-transparent!'>
                                <p>You're all caught up!</p>
                            </DropdownMenuItem>
                        ) : (
                            notifications.pages.map(notification => (
                                <DropdownMenuItem key={notification.id} className='rounded-none p-3! hover:bg-transparent! hover:text-foreground!'>
                                    <Photo
                                        src={notification.image_url || undefined}
                                        alt={notification.name}
                                        className='size-12'
                                        skeletonClassName='size-12'
                                    />
                                    <div className='space-y-2'>
                                        <p className='line-clamp-1 text-xs'><b>{notification.name}</b> wants to connect with you.</p>
                                        <div className='space-x-2'>
                                            <Button size='xs'>Accept</Button>
                                            <Button variant='outline' size='xs'>Decline</Button>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Photo
                            src={auth.user.image_url as string}
                            alt={auth.user.name}
                            className='size-8'
                            skeletonClassName='size-8'
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                        align='end'
                        sideOffset={16}
                    >
                        <UserMenuContent />
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <Separator />

            {(isLoading || !data) ? (
                <section className='mx-auto max-w-2xl space-y-4 p-4'>
                    <Skeleton className='h-6 w-20' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                    <Skeleton className='h-20.75 w-full' />
                </section>
            ) : (
                <section className='mx-auto max-w-2xl space-y-4 p-4'>
                    <h1 className='space-x-2'>
                        <span className='font-semibold'>Contacts</span>
                        <span>&#8226;</span>
                        <span className='font-semibold'>{data.length}</span>
                    </h1>

                    {data.map(chat => <Contact key={chat.id} chat={chat} isOutsideSidebar />)}
                </section>
            )}
        </div>
    )
}
