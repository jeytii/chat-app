import { usePage } from '@inertiajs/react'
import type { InfiniteData } from '@tanstack/react-query'
import { useIsFetching, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { ImagePlay, SendHorizonal, Smile } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import Messages from '@/components/messages'
import { DefaultPhoto } from '@/components/photo'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Conversation as ConversationModel, Message } from '@/types/models'

type PageProps = {
    conversation: { id: number; }
}

export default function Conversation() {
    const { id } = usePage<PageProps>().props.conversation
    const [message, setMessage] = useState<string>('')
    const queryClient = useQueryClient()
    const queryKey = ['messages', id]
    const isFetchingConversations = useIsFetching({ queryKey: ['conversations'] })

    const user = useMemo(() => {
        if (isFetchingConversations) {
            return null
        }

        const conversations = queryClient.getQueryData<ConversationModel[]>(['conversations'])

        if (!conversations) {
            return null
        }

        return conversations.find(conversation => conversation.id === id)?.user || null
    }, [queryClient, id, isFetchingConversations])

    const { mutate } = useMutation<AxiosResponse<{ message: Message }>, Error, string, number>({
        mutationFn: message => axios.post('/messages', {
            conversation_id: id,
            message,
        }),
        async onMutate() {
            await queryClient.cancelQueries({ queryKey })

            const id = Math.floor(Math.random() * 1000000000)

            queryClient.setQueryData<InfiniteData<Message[]>>(
                queryKey,
                current => {
                    if (!current) {
                        return current
                    }

                    return {
                        ...current,
                        pages: current.pages.map((messages, index) => (
                            !index
                                ? [...messages, { id, content: message, gif: null, image_url: null, from_self: true }]
                                : messages
                        )),
                    }
                },
            )

            setMessage('')

            return id
        },
        onSuccess({ data }, variables, id) {
            queryClient.setQueryData<InfiniteData<Message[]>>(
                queryKey,
                current => {
                    if (!current) {
                        return current
                    }

                    return {
                        ...current,
                        pages: current.pages.map((messages, index) => {
                            if (!index) {
                                return messages.map(message => (
                                    message.id === id ? data.message : message
                                ))
                            }

                            return messages
                        }),
                    }
                },
            )
        },
    })

    function handleMessage(event: ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value)
    }

    function send() {
        if (!message.trim().length) {
            return
        }

        mutate(message)
    }

    return (
        <>
            {/* ===== HEADER ===== */}
            <header className='sticky top-0 left-0 flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 z-10 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='-ml-1' />

                    {user ? (
                        <DefaultPhoto width={40} height={40} />
                    ) : (
                        <Skeleton className='size-10 rounded-full' />
                    )}

                    {user ? (
                        <div>
                            <h1>{user.name}</h1>
                            <p className='text-xs text-green-600 dark:text-green-400'>Online</p>
                            {/*<p className='text-xs text-muted-foreground'>Offline</p>*/}
                        </div>
                    ) : (
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-60' />
                            <Skeleton className='h-4 w-10' />
                        </div>
                    )}
                </div>
            </header>

            {/* ===== MESSAGES ===== */}
            <Messages />

            {/* ===== MESSAGE BOX ===== */}
            <div className='sticky bottom-0 left-0 z-10'>
                <InputGroup className='items-end border-x-0 border-b-0 rounded-none dark:bg-transparent'>
                    <InputGroupTextarea
                        placeholder='Write a message'
                        value={message}
                        className='min-h-auto px-4'
                        onChange={handleMessage}
                    />
                    <InputGroupAddon align='block-end'>
                        <InputGroupButton variant='ghost' size='icon-xs'>
                            <Smile />
                        </InputGroupButton>
                        <InputGroupButton variant='ghost' size='icon-xs'>
                            <ImagePlay />
                        </InputGroupButton>
                        <InputGroupButton variant='ghost' size='xs'>
                            GIF
                        </InputGroupButton>
                        <InputGroupButton
                            variant='ghost'
                            size='icon-xs'
                            disabled={!message.trim().length}
                            className='ml-auto'
                            onClick={send}
                        >
                            <SendHorizonal />
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
            </div>
        </>
    )
}
