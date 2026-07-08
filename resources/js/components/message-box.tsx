import { usePage } from '@inertiajs/react'
import type { InfiniteData } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { Image, SendHorizonal, Smile } from 'lucide-react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useEffect, useState } from 'react'
import { Remarkable } from 'remarkable'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import type { Message } from '@/types/models'

type PageProps = {
    conversation: { id: number; }
}

export default function MessageBox() {
    const { id } = usePage<PageProps>().props.conversation
    const [message, setMessage] = useState<string>('')
    const queryClient = useQueryClient()
    const queryKey = ['messages', id]
    const md = new Remarkable({ html: false, breaks: true })

    useEffect(() => {
        return () => {
            setMessage('')
        }
    }, [])

    const { mutate } = useMutation<AxiosResponse<{ message: Message }>, Error, string, { id: number }>({
        mutationFn: message => axios.post('/messages', {
            conversation_id: id,
            message,
        }),
        async onMutate() {
            await queryClient.cancelQueries({ queryKey })

            const itemId = Math.floor(Math.random() * 1000000000)

            queryClient.setQueryData<InfiniteData<Message[]>>(
                queryKey,
                current => {
                    if (!current) {
                        return current
                    }

                    return {
                        ...current,
                        pages: current.pages.map((messages, index) => {
                            if (index === 0) {
                                return [
                                    ...messages,
                                    {
                                        id: itemId,
                                        content: md.render(message),
                                        gif: null,
                                        image_url: null,
                                        from_self: true,
                                    },
                                ]
                            }

                            return messages
                        }),
                    }
                },
            )

            setMessage('')

            return { id: itemId }
        },
        onSettled() {
            queryClient.invalidateQueries({ queryKey })
        },
    })

    function handleMessage(event: ChangeEvent<HTMLTextAreaElement>) {
        setMessage(event.target.value)
    }

    function handleSubmit(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (!event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            send()
        }
    }

    function send() {
        const value = message.trim()

        if (!value.length) {
            return
        }

        mutate(value)
    }

    return (
        <div className='z-10'>
            <InputGroup className='items-end border-x-0 border-b-0 rounded-none dark:bg-transparent'>
                <InputGroupTextarea
                    placeholder='Write a message'
                    value={message}
                    className='min-h-auto px-4'
                    onKeyDown={handleSubmit}
                    onChange={handleMessage}
                />
                <InputGroupAddon align='block-end'>
                    <InputGroupButton variant='ghost' size='icon-xs'>
                        <Smile />
                    </InputGroupButton>
                    <InputGroupButton variant='ghost' size='icon-xs'>
                        <Image />
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
    )
}
