import { Head } from '@inertiajs/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from 'react'

import type { Chat, User } from '@/types/models'

type Props = {
    chatId: number;
    children: (isLoading: boolean, user?: User & { is_online: boolean }) => ReactNode;
}

type Context = {
    isViewing: boolean;
    onlineIds: number[];
    setOnlineIds: Dispatch<SetStateAction<number[]>>;
}

export const PresenceContext = createContext<Context>({
    isViewing: false,
    onlineIds: [],
    setOnlineIds: () => { },
})

export default function PresenceProvider({ chatId, children }: Props) {
    const [onlineIds, setOnlineIds] = useState<number[]>([])
    const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => (
        typeof document === 'undefined' ? 'visible' : document.visibilityState
    ))
    const { data, isLoading } = useQuery<Chat[]>({
        queryKey: ['chats'],
        queryFn: async () => (await fetch('/chats')).json(),
    })
    const queryClient = useQueryClient()

    const chat = data?.find(chat => chat.id === chatId)

    useEffect(() => {
        const markMessagesAsSeen = () => {
            queryClient.setQueryData<Chat[]>(['chats'], current => (
                !current ? current : current.map(chat => ({
                    ...chat,
                    has_new_message: chat.id === chatId ? false : chat.has_new_message,
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
    }, [chatId, queryClient])

    return (
        <>
            <Head title={
                visibilityState === 'hidden' && chat && chat.has_new_message
                    ? `${chat.user.name} sent a message...`
                    : undefined
            } />

            <PresenceContext value={{
                isViewing: visibilityState === 'visible',
                onlineIds,
                setOnlineIds,
            }}>
                {children(isLoading, chat?.user)}
            </PresenceContext>
        </>
    )
}
