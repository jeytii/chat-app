import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'
import type { Message, User } from '@/types'

export default function Messages() {
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<User>(['current-chat'])
  const { data, isFetched } = useQuery<Message[]>({
    queryKey: ['messages', { username: user?.username }],
    async queryFn() {
      const response = await axios.get(
        '/get-messages',
        {
          params: { username: user?.username },
        }
      )

      return response.data.messages
    },
  })

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
    <section className='flex flex-1 overflow-y-auto p-4'>
      <div className='mt-auto flex w-full flex-col gap-2'>
        {data?.map(message => (
          <Card
            key={message.id}
            className={cn(
              'max-w-[80%] text-sm text-primary',
              message.from_self ? 'self-end justify-self-end border-0 bg-secondary' : 'self-start border-border',
              message.loading && 'opacity-50',
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