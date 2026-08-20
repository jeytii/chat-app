import { Head, usePage } from '@inertiajs/react'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, type Dispatch, type ReactNode, type RefObject, type SetStateAction, useEffect, useRef, useState } from 'react'

import type { Chat } from '@/types/models'

type Context = {
    isViewing: boolean;
    onlineIds: RefObject<string[]>;
    reference: string | null;
    setReference: Dispatch<SetStateAction<string | null>>;
}

export const ChatContext = createContext<Context>({
    isViewing: false,
    onlineIds: { current: [] },
    reference: null,
    setReference: () => { },
})

export default function ChatProvider({ chat, children }: { chat: Chat; children: ReactNode }) {
    const id = usePage<{ chat_id: string }>().props.chat_id
    const queryClient = useQueryClient()
    const onlineIds = useRef<string[]>([])
    const [reference, setReference] = useState<string | null>(null)
    const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => (
        typeof document === 'undefined' ? 'visible' : document.visibilityState
    ))

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
            reference,
            setReference,
        }}>
            <Head title={
                visibilityState === 'hidden' && chat && chat.has_new_message
                    ? `${chat.user.name} sent a message...`
                    : undefined
            } />

            {children}
        </ChatContext>
    )
}
