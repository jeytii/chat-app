import { useEffect, useRef } from 'react'
import { type QueryKey, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent } from './ui/card'
import useInfiniteScroll from '@/hooks/infinite-scroll'
import useUpdateMessages from '@/hooks/message'
import { cn } from '@/lib/utils'
import type { Message, User } from '@/types'

interface InfiniteQueryData {
  has_more: boolean;
  messages: Message[];
}

export default function Messages() {
  const queryClient = useQueryClient()
  const root = useRef<HTMLDivElement>(null)
  const user = queryClient.getQueryData<User>(['current-chat'])
  const updateMessages = useUpdateMessages(user?.username as string)

  const {
    data,
    isFetched,
    isFetchingPreviousPage,
    hasPreviousPage,
    fetchPreviousPage,
  } = useInfiniteQuery<InfiniteQueryData, Error, Message[], QueryKey, number>({
    queryKey: ['messages', { username: user?.username }],
    queryFn: async ({ pageParam }) => {
      const response = await axios.get(
        '/get-messages',
        {
          params: {
            username: user?.username,
            page: pageParam,
          },
        }
      )

      return response.data
    },
    initialPageParam: 1,
    getNextPageParam: () => null,
    getPreviousPageParam: (page, pages, cursor) => (
      page.has_more ? cursor + 1 : null
    ),
    select: ({ pages }) => pages.flatMap(page => page.messages),
  })

  const messageRef = useInfiniteScroll(isFetchingPreviousPage, fetchPreviousPage)

  useEffect(() => {
    if (root.current) {
      root.current.scrollTo({ top: root.current.scrollHeight })
    }
  }, [user?.username, isFetched])

  useEffect(() => {
    if (user) {
      const channel = window.Echo.private(`chat.${user.username}`)

      channel.listen('MessageSent', ({ message }: { message: Message; }) => {
        updateMessages((messages) => ([
          ...messages,
          { ...message, from_self: false },
        ]))
      })

      return () => {
        channel.stopListening('MessageSent')
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
        {/* Loading indicator */}
        {isFetchingPreviousPage && (
          <div className='mb-2 text-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 100 100'
              preserveAspectRatio='xMidYMid'
              className='inline-block bg-transparent text-gray-400'
              width='40'
              height='40'
              style={{ shapeRendering: 'auto' }}
            >
              <g>
                <rect
                  fill='currentColor'
                  height='40'
                  width='15'
                  y='30'
                  x='17.5'
                >
                  <animate
                    begin='-0.2s'
                    keySplines='0 0.5 0.5 1;0 0.5 0.5 1'
                    values='18;30;30'
                    keyTimes='0;0.5;1'
                    calcMode='spline'
                    dur='1s'
                    repeatCount='indefinite'
                    attributeName='y'
                  >
                  </animate>
                  <animate
                    begin='-0.2s'
                    keySplines='0 0.5 0.5 1;0 0.5 0.5 1'
                    values='64;40;40'
                    keyTimes='0;0.5;1'
                    calcMode='spline'
                    dur='1s'
                    repeatCount='indefinite'
                    attributeName='height'
                  >
                  </animate>
                </rect>
                <rect
                  fill='currentColor'
                  height='40'
                  width='15'
                  y='30'
                  x='42.5'
                >
                  <animate
                    begin='-0.1s'
                    keySplines='0 0.5 0.5 1;0 0.5 0.5 1'
                    values='20.999999999999996;30;30'
                    keyTimes='0;0.5;1'
                    calcMode='spline'
                    dur='1s'
                    repeatCount='indefinite'
                    attributeName='y'
                  >
                  </animate>
                  <animate
                    begin='-0.1s'
                    keySplines='0 0.5 0.5 1;0 0.5 0.5 1'
                    values='58.00000000000001;40;40'
                    keyTimes='0;0.5;1'
                    calcMode='spline'
                    dur='1s'
                    repeatCount='indefinite'
                    attributeName='height'
                  >
                  </animate>
                </rect>
                <rect
                  fill='currentColor'
                  height='40'
                  width='15'
                  y='30'
                  x='67.5'
                >
                  <animate
                    keySplines='0 0.5 0.5 1;0 0.5 0.5 1'
                    values='20.999999999999996;30;30'
                    keyTimes='0;0.5;1'
                    calcMode='spline'
                    dur='1s'
                    repeatCount='indefinite'
                    attributeName='y'
                  >
                  </animate>
                  <animate
                    keySplines='0 0.5 0.5 1;0 0.5 0.5 1'
                    values='58.00000000000001;40;40'
                    keyTimes='0;0.5;1'
                    calcMode='spline'
                    dur='1s'
                    repeatCount='indefinite'
                    attributeName='height'
                  >
                  </animate>
                </rect>
              </g>
            </svg>
          </div>
        )}

        {/* Messages */}
        {data?.map((message, index) => (
          <Card
            key={message.id}
            ref={index === 0 && hasPreviousPage ? messageRef : null}
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
      </div>
    </section>
  )
}