import { type InfiniteData, useQueryClient } from '@tanstack/react-query'

import type { Message, MessageResponse } from '@/types/models'

export function useInsertMessage() {
    const queryClient = useQueryClient()

    return (conversationId: number, message: Message, notFromSelf: boolean = false) => {
        queryClient.setQueryData<InfiniteData<MessageResponse>>(['messages', conversationId], current => {
            if (!current) {
                return current
            }

            // Insert new item into a new page if the latest one has reached the pagination count
            if (current.pages[current.pages.length - 1].items.length >= 20) {
                return {
                    pageParams: [
                        null,
                        ...current.pageParams,
                    ],
                    pages: [
                        ...current.pages,
                        {
                            items: [notFromSelf ? { ...message, from_self: false } : message],
                            next_cursor: null,
                        },
                    ],
                }
            }

            // Else, push it into the latest page
            return {
                ...current,
                pages: current.pages.map((page, index, pages) => {
                    if (index === pages.length - 1) {
                        return {
                            ...page,
                            items: [
                                ...page.items,
                                notFromSelf ? { ...message, from_self: false } : message,
                            ],
                        }
                    }

                    return page
                }),
            }
        })
    }
}
