import { useMutation } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { Image, Smile, X } from 'lucide-react'
import { type ChangeEvent, useEffect, useState } from 'react'

import { Bubble } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageContent } from '@/components/ui/message'
import { Textarea } from '@/components/ui/textarea'
import useAttachment from '@/hooks/use-attachment'
import useMessage from '@/hooks/use-message'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/models'

type Props = {
    message: Message;
    chatId: number;
    cancel: CallableFunction;
}

type Payload = {
    id: number;
    reference_id: number | null;
    content: string;
    image: File | string | null;
    gif: string | null;
}

export default function MessageEditor({ message, chatId, cancel }: Props) {
    const [reference, setReference] = useState<Message['reference']>(message.reference)
    const {
        image,
        gif,
        previewImage,
        setImage,
        setGif,
        revokePreviewImage,
    } = useAttachment(message.image_url, message.gif)

    const { alter } = useMessage()

    const { mutate, isPending } = useMutation<AxiosResponse<Message>, Error, Payload>({
        mutationFn: ({ id, ...payload }) => axios.post(
            `/chats/${chatId}/messages/${id}`,
            { _method: 'PATCH', ...payload },
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Socket-ID': window.Echo.socketId(),
                },
            },
        ),
        onMutate(payload, { client }) {
            client.cancelQueries({ queryKey: ['messages', chatId] })
        },
        onSuccess({ data }, { id }) {
            alter(chatId, id, data)
        },
        async onSettled(data, error, payload, context, { client }) {
            await client.invalidateQueries({
                queryKey: ['messages', chatId],
                refetchType: 'none',
            })

            cancel()
        },
    })

    useEffect(() => {
        return () => {
            revokePreviewImage()
        }
    }, [revokePreviewImage])

    function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = (event.target.files as FileList)[0]

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return
        }

        revokePreviewImage()
        setGif(null)
        setImage(file)
    }

    function removeUpload() {
        if (isPending) {
            return
        }

        revokePreviewImage()
        setImage(null)
        setGif(null)
    }

    function update(data: FormData) {
        const content = data.get('content')?.toString() || ''

        if (
            (
                (message.content || '') === content
                && message.image_url === image
                && message.gif === gif
            )
            || isPending
        ) {
            return
        }

        mutate({
            id: message.id,
            reference_id: reference?.id || null,
            content,
            image,
            gif,
        })
    }

    function cancelEditMode() {
        cancel()
    }

    return (
        <MessageContent className='gap-1'>
            {!!reference && (
                <div className='flex items-center gap-2 self-end'>
                    <Button
                        variant='ghost'
                        size='icon-sm'
                        disabled={isPending}
                        onClick={setReference.bind(null, null)}
                    >
                        <X />
                    </Button>

                    <Card size='sm' className='p-0'>
                        <CardContent className='responsive-message relative flex items-center gap-2 px-4 py-(--card-spacing) before:absolute before:top-0 before:left-0 before:block before:h-full before:w-1 before:bg-primary before:content-[""]'>
                            {!!reference.image_url && (
                                <img src={reference.image_url} alt='Attachment' className='aspect-square w-12 rounded-xs' />
                            )}

                            <p className='line-clamp-2 w-full text-muted-foreground italic'>
                                {reference.raw_content || '(Sent an image)'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Bubble align='end' variant='ghost'>
                <form action={update} className='space-y-1'>
                    <div className='rounded-md border'>
                        <Textarea
                            name='content'
                            defaultValue={message.raw_content || ''}
                            placeholder='Write a message'
                            disabled={isPending}
                            className='responsive-message ml-auto min-h-auto! min-w-25 rounded-none border-x-0 border-t-0 leading-relaxed'
                        />

                        <div className='space-x-1 px-1 text-right'>
                            <Button
                                type='button'
                                variant='ghost'
                                size='icon-sm'
                                disabled={isPending}>
                                <Smile />
                            </Button>
                            <Button
                                type='button'
                                variant='ghost'
                                size='icon-sm'
                                disabled={isPending}
                                asChild
                            >
                                <label>
                                    <Image />
                                    <input
                                        type='file'
                                        accept='image/jpeg, image/png, image/webp'
                                        className='hidden'
                                        onChange={upload}
                                    />
                                </label>
                            </Button>
                            <Button
                                type='button'
                                variant='ghost'
                                size='icon-sm'
                                disabled={isPending}
                            >
                                <svg viewBox='0 0 20 20' fill='currentColor'>
                                    <path fillRule='evenodd' d='M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm4.026 2.879C5.356 7.65 5.72 7.5 6 7.5s.643.15.974.629a.75.75 0 0 0 1.234-.854C7.66 6.484 6.873 6 6 6c-.873 0-1.66.484-2.208 1.275C3.25 8.059 3 9.048 3 10c0 .952.25 1.941.792 2.725C4.34 13.516 5.127 14 6 14c.873 0 1.66-.484 2.208-1.275a.75.75 0 0 0 .133-.427V10a.75.75 0 0 0-.75-.75H6.25a.75.75 0 0 0 0 1.5h.591v1.295c-.293.342-.6.455-.841.455-.279 0-.643-.15-.974-.629C4.69 11.386 4.5 10.711 4.5 10c0-.711.19-1.386.526-1.871ZM10.75 6a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Zm3 0h2.5a.75.75 0 0 1 0 1.5H14.5v1.75h.75a.75.75 0 0 1 0 1.5h-.75v2.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Z' clipRule='evenodd' />
                                </svg>
                            </Button>
                        </div>
                    </div>

                    {!!previewImage && (
                        <div className='relative ml-auto max-w-62.5'>
                            <img
                                src={previewImage}
                                className={cn(
                                    'block w-full rounded-md',
                                    { 'opacity-60': isPending },
                                )}
                            />

                            {!isPending && (
                                <Button
                                    variant='ghost'
                                    size='icon-xs'
                                    className='absolute top-2 right-2 bg-secondary hover:bg-secondary! dark:bg-background dark:hover:bg-background!'
                                    onClick={removeUpload}
                                >
                                    <X />
                                </Button>
                            )}
                        </div>
                    )}

                    <div className='space-x-2 text-right'>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            disabled={isPending}
                            onClick={cancelEditMode}
                        >
                            Cancel
                        </Button>
                        <Button size='sm' disabled={isPending}>Update</Button>
                    </div>
                </form>
            </Bubble>
        </MessageContent>
    )
}
