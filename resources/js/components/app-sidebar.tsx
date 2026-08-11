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
    sender_id: number;
}

export function AppSidebar() {
    const { auth, chat_id: chatId } = usePage<{ chat_id: number }>().props
    const { insert, alter, remove } = useMessage()

    useEffect(() => {
        const channel = window.Echo.private(`chat.${chatId}`)
        const events = window.Echo.connector.channel(`private-chat.${chatId}`).subscription.callbacks._callbacks

        if (!events['_BackgroundMessageSent']) {
            channel.listen('.BackgroundMessageSent', ({ sender_id: senderId, ...message }: MessageSentData) => {
                if (!events['_MessageSent']) {
                    insert(chatId, {
                        ...message,
                        from_self: senderId === auth.user.id,
                    })
                }
            })
        }

        if (!events['_BackgroundMessageEdited']) {
            channel.listen('.BackgroundMessageEdited', (message: Message) => {
                if (!events['_MessageEdited']) {
                    alter(chatId, message.id, message)
                }
            })
        }

        if (!events['_BackgroundMessageDeleted']) {
            channel.listen('.BackgroundMessageDeleted', (message: Pick<Message, 'id'>) => {
                if (!events['_MessageDeleted']) {
                    remove(chatId, message.id)
                }
            })
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
