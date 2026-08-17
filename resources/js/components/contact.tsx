import { Link, usePage } from '@inertiajs/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import Photo from '@/components/photo'
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import useMessage from '@/hooks/use-message'
import type { Chat, Message } from '@/types/models'

type MessageSentData = Omit<Message, 'from_self'> & {
    chat_id: string;
    sender_email: string;
}

type MessageEditedData = Message & { chat_id: string }

export default function Contact({ chat }: { chat: Chat }) {
    const { auth, chat_id: chatId } = usePage<{ chat_id: string }>().props
    const queryClient = useQueryClient()
    const { insert, alter, remove } = useMessage()

    const insertRef = useRef<(chatId: string, message: Message) => void>(insert)
    const alterRef = useRef<(chatId: string, id: string, newData: Partial<Message>) => void>(alter)
    const removeRef = useRef<(chatId: string, id: string) => void>(remove)

    useEffect(() => {
        insertRef.current = insert
        alterRef.current = alter
        removeRef.current = remove
    })

    useEffect(() => {
        const { channels } = window.Echo.connector

        window.Echo.private(`chat.${chat.id}`)
            .listen('.MessageSent', ({ chat_id: privateChatId, sender_email: senderEmail, ...message }: MessageSentData) => {
                if (!channels[`presence-room.${privateChatId}`]) {
                    queryClient.setQueryData<Chat[]>(['chats'], current => (
                        !current ? current : current.map(chat => ({
                            ...chat,
                            has_new_message: chat.id === privateChatId ? true : chat.has_new_message,
                        }))
                    ))

                    insertRef.current(chat.id, {
                        ...message,
                        from_self: senderEmail === auth.user.email,
                    })
                }
            })
            .listen('.MessageEdited', ({ chat_id: privateChatId, ...message }: MessageEditedData) => {
                if (!channels[`presence-room.${privateChatId}`]) {
                    alterRef.current(chat.id, message.id, message)
                }
            })
            .listen('.MessageDeleted', (message: { chat_id: string; id: string }) => {
                if (!channels[`presence-room.${message.chat_id}`]) {
                    removeRef.current(chat.id, message.id)
                }
            })

        return () => {
            window.Echo.leave(`chat.${chat.id}`)
        }
    }, [auth.user.email, chat.id, queryClient])

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                size='lg'
                isActive={chatId === chat.id}
                asChild
                className='data-[active=false]:hover:bg-transparent data-[active=false]:hover:text-sidebar-foreground'
            >
                <Link href={`/chats/${chat.id}`} replace>
                    <div className='relative'>
                        <Photo src={chat.user.image_url as string} alt={chat.user.name} />

                        {chat.is_online && (
                            <span className='absolute right-px bottom-px size-2.5 rounded-full border border-primary bg-green-700' />
                        )}
                    </div>
                    <div className='overflow-hidden'>
                        <h5 className='truncate'>{chat.user.name}</h5>
                        <p className='truncate text-xs text-muted-foreground'>{chat.user.username}</p>
                    </div>
                </Link>
            </SidebarMenuButton>

            {chat.has_new_message && (
                <SidebarMenuAction className='top-1/2! w-auto -translate-y-1/2'>
                    <div className='size-2 rounded-full bg-primary' />
                </SidebarMenuAction>
            )}
        </SidebarMenuItem>
    )
}
