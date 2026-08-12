import { Link, usePage } from '@inertiajs/react'
import { useEffect } from 'react'

import AppLogo from '@/components/app-logo'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import useMessage from '@/hooks/use-message'
import { Message } from '@/types/models'

type MessageSentData = Omit<Message, 'from_self'> & {
    chat_id: number;
    sender_id: number;
}

type MessageEditedData = Message & { chat_id: number }

export function AppSidebar() {
    const { auth, chat_id: chatId } = usePage<{ chat_id: number }>().props
    const { insert, alter, remove } = useMessage()

    useEffect(() => {
        if (chatId) {
            const { channels } = window.Echo.connector

            if (!channels[`private-chat.${chatId}`]) {
                window.Echo.private(`chat.${chatId}`)
                    .listen('.MessageSent', ({ chat_id: privateChatId, sender_id: senderId, ...message }: MessageSentData) => {
                        if (!channels[`presence-room.${privateChatId}`]) {
                            insert(chatId, {
                                ...message,
                                from_self: senderId === auth.user.id,
                            })
                        }
                    })
                    .listen('.MessageEdited', ({ chat_id: privateChatId, ...message }: MessageEditedData) => {
                        if (!channels[`presence-room.${privateChatId}`]) {
                            alter(chatId, message.id, message)
                        }
                    })
                    .listen('.MessageDeleted', (message: { chat_id: number; id: number }) => {
                        if (!channels[`presence-room.${message.chat_id}`]) {
                            remove(chatId, message.id)
                        }
                    })
            }
        }
    }, [auth.user.id, chatId, insert, alter, remove])

    return (
        <Sidebar collapsible='icon' variant='inset' className='px-0!'>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' asChild>
                            <Link href='/' prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
