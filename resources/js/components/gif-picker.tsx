import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import { type ChangeEventHandler } from 'react'

import { Input } from '@/components/ui/input'
import { PopoverHeader } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Gif = {
    id: number;
    title: string;
    md: string;
    sm: string;
}

type HttpResponse = {
    data: Gif[];
    page: number;
    has_next: boolean;
}

async function getGifs(page: number, signal: AbortSignal) {
    const { data } = await axios.get<HttpResponse>('/gifs', {
        params: { page },
        signal,
    })

    return data
}

export default function GifPicker({ onSelect }: { onSelect: ChangeEventHandler }) {
    const { data, isLoading } = useInfiniteQuery<
        HttpResponse,
        Error,
        InfiniteData<Gif>,
        readonly unknown[],
        number
    >({
        queryKey: ['gifs'],
        queryFn: ({ pageParam, signal }) => getGifs(pageParam, signal),
        getNextPageParam: ({ page, has_next: hasNext }) => hasNext ? page + 1 : null,
        initialPageParam: 1,
        select: data => ({
            ...data,
            pages: data.pages.flatMap(page => page.data),
        }),
    })

    return (
        <>
            <PopoverHeader>
                <Input placeholder='Search GIFs' className='text-sm' disabled={isLoading} />
            </PopoverHeader>

            <div className={cn(
                'h-100 w-[70vw] flex-1 px-2 sm:w-100',
                isLoading ? 'overflow-y-hidden' : 'overflow-y-auto',
            )}>
                {(isLoading || !data) ? (
                    <div className='columns-2 gap-2 space-y-2'>
                        <Skeleton className='aspect-square w-full rounded-none' />
                        <Skeleton className='aspect-square w-full rounded-none' />
                        <Skeleton className='aspect-square w-full rounded-none' />
                        <Skeleton className='aspect-square w-full rounded-none' />
                        <Skeleton className='aspect-square w-full rounded-none' />
                        <Skeleton className='aspect-square w-full rounded-none' />
                        <Skeleton className='aspect-square w-full rounded-none' />
                    </div>
                ) : (
                    <div className='columns-2 gap-2 space-y-2'>
                        {data.pages.map(gif => (
                            <label key={gif.id} className='block w-full cursor-pointer'>
                                <img
                                    src={gif.sm}
                                    alt={gif.title}
                                    loading='lazy'
                                    className='block w-full'
                                />
                                <input
                                    type='radio'
                                    name='gif'
                                    value={gif.md}
                                    className='hidden'
                                    onChange={onSelect}
                                />
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <p className='px-2 py-1 text-center text-sm text-muted-foreground'>Powered by Klipy</p>
        </>
    )
}
