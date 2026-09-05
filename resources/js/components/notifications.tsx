import { Link, router, usePage } from '@inertiajs/react'
import { useInfiniteScroll, useRefState } from '@siberiacancode/reactuse'
import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Bell } from 'lucide-react'
import type { MouseEvent } from 'react'

import Photo from '@/components/photo'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Notification, NotificationResponse } from '@/types/models'

type HttpResponse = {
    items: {
        id: string;
        data: Pick<Notification, 'name' | 'image_url'>;
        read_at: string | null;
    }[];
    next_cursor: string | null;
}

export default function Notifications({ className }: { className?: string }) {
    const { has_new_notifications: hasNewNotifications } = usePage().props.auth

    function toggleNotifications(open: boolean) {
        if (open && hasNewNotifications) {
            router.replaceProp('auth.has_new_notifications', false)
            axios.post('/notifications/peek')
        }
    }

    return (
        <Popover onOpenChange={toggleNotifications}>
            <PopoverTrigger asChild>
                <Button
                    variant='ghost'
                    size='icon-sm'
                    className={cn(
                        'relative ml-auto data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:hover:bg-accent! data-[state=open]:hover:text-accent-foreground!',
                        className,
                    )}
                >
                    <Bell />
                    {hasNewNotifications && <div className='absolute top-1 right-2 size-2 rounded-full bg-destructive' />}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align='end'
                sideOffset={16}
                asChild
                className='w-auto! p-0'
            >
                <Content />
            </PopoverContent>
        </Popover>
    )
}

function Content() {
    const queryClient = useQueryClient()
    const ref = useRefState<HTMLDivElement>()
    const { data: notifications, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery<NotificationResponse, Error, InfiniteData<Notification>>({
        queryKey: ['notifications'],
        queryFn: async ({ pageParam }) => {
            const { data } = await axios.get<HttpResponse>('/notifications', {
                params: { cursor: pageParam },
            })

            return {
                ...data,
                items: data.items.map(item => ({
                    ...item.data,
                    id: item.id,
                    read_at: item.read_at,
                })),
            }
        },
        initialPageParam: null,
        getNextPageParam: page => page.next_cursor,
        select: data => ({
            ...data,
            pages: data.pages.flatMap(page => page.items),
        }),
    })

    useInfiniteScroll(ref, () => {
        fetchNextPage()
    }, {
        distance: 40,
        hasMore: hasNextPage,
    })

    function markAsRead(notification: Notification) {
        if (notification.read_at) {
            return
        }

        queryClient.setQueryData<InfiniteData<NotificationResponse>>(['notifications'], current => {
            if (!current) {
                return current
            }

            return {
                ...current,
                pages: current.pages.map(page => ({
                    ...page,
                    items: page.items.map(item => ({
                        ...item,
                        read_at: item.id === notification.id ? new Date().toDateString() : item.read_at,
                    })),
                })),
            }
        })

        axios.put(`/notifications/${notification.id}/read`)
    }

    function stopPropagation(event: MouseEvent) {
        event.stopPropagation()
    }

    if (isLoading || !notifications) {
        return (
            <div className='w-70 rounded-b-md border bg-background sm:w-90'>
                <div className='flex items-center gap-2 p-3'>
                    <Skeleton className='h-13 w-15 rounded-full' />
                    <div className='w-full space-y-2'>
                        <Skeleton className='h-3 w-full' />
                        <Skeleton className='h-3 w-1/2' />
                    </div>
                </div>
                <div className='flex items-center gap-2 p-3'>
                    <Skeleton className='h-13 w-15 rounded-full' />
                    <div className='w-full space-y-2'>
                        <Skeleton className='h-3 w-full' />
                        <Skeleton className='h-3 w-1/2' />
                    </div>
                </div>
            </div>
        )
    }

    if (!notifications.pages.length) {
        return (
            <div className='w-70 rounded-b-md border bg-background p-3 sm:w-90'>
                <p className='text-center text-sm'>No requests received.</p>
            </div>
        )
    }

    return (
        <ScrollArea className='max-w-70 min-w-56 rounded-b-md border bg-background sm:max-w-90'>
            <div ref={ref} className='max-h-86 divide-y overflow-y-auto sm:max-h-91'>
                {notifications.pages.map(notification => (
                    <Link
                        key={notification.id}
                        href='/'
                        onClick={stopPropagation}
                        onSuccess={markAsRead.bind(null, notification)}
                        className={cn(
                            'flex items-center gap-2 p-2.5 sm:p-3',
                            notification.read_at ? 'hover:bg-muted' : 'bg-primary/20 hover:bg-primary/30',
                        )}
                    >
                        <Photo
                            src={notification.image_url || undefined}
                            alt={notification.name}
                            className='size-12'
                            skeletonClassName='size-12'
                        />
                        <p className='line-clamp-2 text-sm'>
                            <b>{notification.name}</b> <span className='text-foreground/90'>wants to connect with you.</span>
                        </p>
                    </Link>
                ))}

                {hasNextPage && (
                    <div className='flex items-center gap-2 p-3'>
                        <Skeleton className='h-13 w-15 rounded-full' />
                        <div className='w-full space-y-2'>
                            <Skeleton className='h-3 w-full' />
                            <Skeleton className='h-3 w-1/2' />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}
