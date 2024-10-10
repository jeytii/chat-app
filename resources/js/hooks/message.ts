import { type InfiniteData, useQueryClient } from '@tanstack/react-query'
import type { Message } from '@/types'

interface InfiniteQueryData {
  has_more: boolean;
  messages: Message[];
}

type ActionCallback = (messages: Message[]) => Message[];

export default function useUpdateMessages(username: string): (callback: ActionCallback) => void {
  const queryClient = useQueryClient()

  function action(callback: ActionCallback) {
    queryClient.setQueryData<InfiniteData<InfiniteQueryData, number>>(
      ['messages', { username }],
      (current) => {
        if (current) {
          return {
            ...current,
            pages: current.pages.map((page, index, array) => {
              if (index === array.length - 1) {
                return {
                  ...page,
                  messages: callback(page.messages),
                }
              }
    
              return page
            })
          }
        }
      }
    )
  }

  return action
}