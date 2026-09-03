import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { Notification, NotificationResponse } from '@/types/models'

type RawNotification = {
    id: string;
    data: {
        user_id: string;
        name: string;
        image_url: string | null;
    },
    read_at: string | null;
}

type HttpResponse = {
    items: RawNotification[];
    next_cursor: string | null;
}

export default function useNotifications() {
    return useInfiniteQuery<NotificationResponse, Error, InfiniteData<Notification>>({
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
}
