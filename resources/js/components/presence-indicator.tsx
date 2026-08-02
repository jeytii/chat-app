import { usePage } from '@inertiajs/react'
import Echo from 'laravel-echo'
import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/use-limit'

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
})

export default function PresenceIndicator({ conversationId, isOnline }: { conversationId: number; isOnline: boolean; }) {
    const { username } = usePage().props.auth.user
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const { debouncedFn } = useDebounce(1000)

    useEffect(() => {
        echo.private(`conversation.${conversationId}`)
            .listenForWhisper('typing', data => {
                if (data.username !== username) {
                    if (data.sent) {
                        setIsTyping(false)
                    } else {
                        setIsTyping(true)

                        debouncedFn(() => {
                            setIsTyping(false)
                        })
                    }
                }
            })

        return () => {
            echo.private(`conversation.${conversationId}`)
                .stopListeningForWhisper('typing')

            setIsTyping(false)
        }
    }, [conversationId, username, debouncedFn])

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
