import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/use-limit'

export default function PresenceIndicator({ chatId, isOnline }: { chatId: string; isOnline: boolean; }) {
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const { debounce } = useDebounce(1000)

    useEffect(() => {
        const channel = window.Echo.join(`room.${chatId}`)

        channel.listenForWhisper('typing', () => {
            setIsTyping(true)

            debounce(() => {
                setIsTyping(false)
            })
        })

        return () => {
            channel.stopListeningForWhisper('typing')

            setIsTyping(false)
        }
    }, [chatId, debounce])

    if (isTyping) {
        return (
            <div className='flex items-end gap-1'>
                <p className='text-xs text-primary'>Typing</p>
                <div className='relative bottom-1 flex gap-1'>
                    <span className='block size-[3.5px] animate-[blink_900ms_infinite_linear_300ms] rounded-full bg-primary' />
                    <span className='block size-[3.5px] animate-[blink_900ms_infinite_linear_600ms] rounded-full bg-primary' />
                    <span className='block size-[3.5px] animate-[blink_900ms_infinite_linear_900ms] rounded-full bg-primary' />
                </div>
            </div>
        )
    }

    if (isOnline) {
        return <p className='text-xs text-green-600 dark:text-green-400'>Online</p>
    }

    return <p className='text-xs text-muted-foreground'>Offline</p>
}
