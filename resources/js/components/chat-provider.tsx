import { usePage } from '@inertiajs/react'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from 'react'

import type { Chat } from '@/types/models'

type Context = {
    isViewing: boolean;
    onlineIds: number[];
    replyTo: number | null;
    setOnlineIds: Dispatch<SetStateAction<number[]>>;
    setReplyTo: Dispatch<SetStateAction<number | null>>;
}

export const ChatContext = createContext<Context>({
    isViewing: false,
    onlineIds: [],
    replyTo: null,
    setOnlineIds: () => { },
    setReplyTo: () => { },
})

export default function ChatProvider({ children }: { children: (isHidden: boolean) => ReactNode }) {
    const id = usePage<{ chat_id: number }>().props.chat_id
    const [onlineIds, setOnlineIds] = useState<number[]>([])
    const [replyTo, setReplyTo] = useState<number | null>(null)
    const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => (
        typeof document === 'undefined' ? 'visible' : document.visibilityState
    ))

    const queryClient = useQueryClient()

    useEffect(() => {
        const markMessagesAsSeen = () => {
            queryClient.setQueryData<Chat[]>(['chats'], current => (
                !current ? current : current.map(chat => ({
                    ...chat,
                    has_new_message: chat.id === id ? false : chat.has_new_message,
                }))
            ))
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                markMessagesAsSeen()
            }

            setVisibilityState(document.visibilityState)
        }

        markMessagesAsSeen()

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [id, queryClient])

    return (
        <ChatContext value={{
            isViewing: visibilityState === 'visible',
            onlineIds,
            replyTo,
            setOnlineIds,
            setReplyTo,
        }}>
            {children(visibilityState === 'hidden')}
        </ChatContext>
    )
}
