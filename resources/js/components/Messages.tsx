import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'
import type { Message, User } from '@/types'

export default function Messages() {
  const queryClient = useQueryClient()
  const root = useRef<HTMLDivElement>(null)
  const user = queryClient.getQueryData<User>(['current-chat'])
  const { data, isFetched } = useQuery<Message[]>({
    queryKey: ['messages', { username: user?.username }],
    async queryFn({ queryKey }) {
      const cachedData = queryClient.getQueryData(queryKey)

      if (cachedData) {
        return cachedData
      }

      const response = await axios.get(
        '/get-messages',
        {
          params: { username: user?.username },
        }
      )

      return response.data.messages
    },
  })

  useEffect(() => {
    if (root.current) {
      root.current.scrollTo({ top: root.current.scrollHeight })
    }
  }, [user?.username, data?.length])

  useEffect(() => {
    if (user) {
      window.Echo.private(`chat.${user.username}`)
        .listen('MessageSent', ({ message }: { message: Message; }) => {
          queryClient.setQueryData<Message[]>(
            ['messages', { username: user.username }],
            (prev) => {
              if (prev) {
                return [
                  ...prev,
                  { ...message, from_self: false, loading: false },
                ]
              }
            }
          )
        })

      return () => {
        window.Echo.leave(`chat.${user.username}`)
      }
    }
  }, [user?.username])

  if (isFetched && data && !data.length) {
    return (
      <section className='flex flex-1 overflow-y-auto p-4'>
        <div className='mt-auto w-full'>
          <p className='text-center text-sm text-gray-500'>Say hi to start a conversation.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={root}
      className='flex flex-1 overflow-y-auto p-4'
    >
      <div className='mt-auto flex w-full flex-col gap-2'>
        {data?.map(message => (
          <Card
            key={message.id}
            className={cn(
              'max-w-[80%] text-sm text-primary',
              message.from_self ? 'self-end justify-self-end bg-secondary' : 'self-start border-border',
              message.loading && 'opacity-50',
              message.is_not_sent && 'border-red-500',
            )}
          >
            <CardContent className='px-4 py-2'>
              <div dangerouslySetInnerHTML={{ __html: message.content }} />
            </CardContent>
          </Card>
        ))}
        {/* <div className='flex items-center gap-2 self-end'>
            <span className='text-xs text-gray-500'>Seen</span>
            <Check
              className='inline'
              color='green'
              size='15'
            />
          </div> */}
      </div>
    </section>
  )
}