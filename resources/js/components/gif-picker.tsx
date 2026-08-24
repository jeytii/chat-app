import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { type ChangeEvent, useState } from 'react'

import { Input } from '@/components/ui/input'
import { PopoverHeader } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { useDebounce } from '@/hooks/use-limit'
import { cn } from '@/lib/utils'

type Gif = {
    id: number;
    title: string;
    md: string;
    sm: string;
}

export default function GifPicker({ onSelect }: { onSelect: (gif: { md: string; sm: string }) => void }) {
    const [query, setQuery] = useState<string>('')
    const { debounce } = useDebounce()

    const { data, isLoading } = useQuery<Gif[], Error, Gif[], readonly string[]>({
        queryKey: query ? ['gifs', query] : ['gifs'],
        queryFn: async ({ queryKey, signal }) => {
            const { data } = await axios.get<Gif[]>('/gifs', {
                params: { q: queryKey[1] || undefined },
                signal,
            })

            return data
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    })

    function handleQuery(event: ChangeEvent<HTMLInputElement>) {
        debounce(() => {
            setQuery(event.target.value)
        })
    }

    function select({ md, sm }: Gif, event: ChangeEvent<HTMLInputElement>) {
        event.preventDefault()

        onSelect({ md, sm })
    }

    return (
        <>
            <PopoverHeader>
                <Input
                    placeholder='Search GIFs'
                    onChange={handleQuery}
                    className='rounded-sm text-sm'
                />
            </PopoverHeader>

            <div className={cn(
                'h-100 w-[70vw] flex-1 md:w-100',
                isLoading ? 'overflow-y-hidden' : 'overflow-y-auto',
            )}>
                {(isLoading || !data) ? (
                    <div className='py-4'>
                        <Spinner className='mx-auto size-6' />
                    </div>
                ) : (
                    <div className='columns-2 gap-2 space-y-2'>
                        {data.map(gif => (
                            <label key={gif.id} className='block w-full cursor-pointer'>
                                <img
                                    src={gif.sm}
                                    alt={gif.title}
                                    loading='lazy'
                                    className='block w-full rounded-xs'
                                />
                                <input
                                    type='radio'
                                    name='gif'
                                    value={gif.md}
                                    className='hidden'
                                    onChange={select.bind(null, gif)}
                                />
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <p className='text-center text-sm text-muted-foreground'>Powered by Klipy</p>
        </>
    )
}
