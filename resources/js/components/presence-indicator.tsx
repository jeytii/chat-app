import { usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/use-limit'
import usePrivateChannel from '@/hooks/use-private-channel'

export default function PresenceIndicator({ conversationId, isOnline }: { conversationId: number; isOnline: boolean; }) {
    const { username } = usePage().props.auth.user
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const { debouncedFn } = useDebounce(1000)
    const channel = usePrivateChannel(`conversation.${conversationId}`)

    useEffect(() => {
        channel.listenForWhisper('typing', data => {
            if (data.username !== username) {
                setIsTyping(true)

                debouncedFn(() => {
                    setIsTyping(false)
                })
            }
        })

        return () => {
            channel.stopListeningForWhisper('typing')

            setIsTyping(false)
        }
    }, [conversationId, username, channel, debouncedFn])

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
