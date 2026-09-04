import { router, usePage } from '@inertiajs/react'
import { useInfiniteScroll, useRefState } from '@siberiacancode/reactuse'
import { type InfiniteData, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Bell } from 'lucide-react'
import { useMemo } from 'react'

import Photo from '@/components/photo'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import useNotifications from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import type { NotificationResponse } from '@/types/models'

export default function Notifications({ className }: { className?: string }) {
    const { auth } = usePage().props
    const queryClient = useQueryClient()
    const ref = useRefState<HTMLDivElement>()
    const { data: notifications, fetchNextPage } = useNotifications()

    useInfiniteScroll(ref, () => {
        fetchNextPage()
    })

    const hasNewNotifications = useMemo<boolean>(
        () => notifications?.pages.some(notification => !notification.read_at) || auth.has_new_notifications,
        [auth.has_new_notifications, notifications],
    )

    function toggleNotifications(open: boolean) {
        if (open && hasNewNotifications) {
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
    }

    return (
        <Popover onOpenChange={toggleNotifications}>
            <PopoverTrigger asChild>
                <Button variant='ghost' size='icon-sm' className={cn('relative ml-auto', className)}>
                    <Bell />
                    {hasNewNotifications && (
                        <div className='absolute top-1 right-2 size-2 rounded-full bg-destructive' />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align='end'
                className='w-auto! p-0'
                asChild
                sideOffset={16}
            >
                {notifications?.pages.length ? (
                    <div ref={ref} className='max-h-92.5 max-w-70 min-w-56 divide-y overflow-y-auto sm:max-w-90'>
                        {notifications.pages.map(notification => (
                            <div key={notification.id} className='flex items-center gap-2 p-3'>
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='min-w-56 p-3 text-center'>
                        <p>You're all caught up!</p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
