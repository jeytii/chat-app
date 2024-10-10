import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Avatar from './Avatar'
import { useToast } from '@/hooks/use-toast'
import useUpdateMessages from '@/hooks/message'
import { cn } from '@/lib/utils'
import type { ChatContact, Message, User } from '@/types'

export default function Contact(props: ChatContact) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const updateMessages = useUpdateMessages(props.username)
  const currentChat = queryClient.getQueryData<ChatContact>(['current-chat'])
  const isActive = useMemo(() => currentChat ? currentChat.username === props.username : false, [currentChat])
  const unreadMessagesCount = props.unread_messages_count

  useEffect(() => {
    window.Echo.private(`chat.${props.username}`)
      .listen('AddedNewMessage', ({ message }: { message: Message; }) => {
        const currentChat = queryClient.getQueryData<ChatContact>(['current-chat'])

        if (!currentChat || currentChat.username !== props.username) {
          queryClient.setQueryData<ChatContact[]>(['contacts'], (prev) => {
            if (prev) {
              return prev.map(contact => ({
                ...contact,
                unread_messages_count: contact.unread_messages_count + 1,
              }))
            }
          })

          updateMessages((messages) => ([
            ...messages,
            { ...message, from_self: false },
          ]))
        } else {
          axios.put('messages/mark-as-read', {
            username: props.username
          })
        }
      })
      .listen('RemovedFromContacts', ({ user }: { user: User; }) => {
        const currentChat = queryClient.getQueryData<ChatContact>(['current-chat'])
        const currentUrl = new URL(window.location.href)

        queryClient.setQueryData<ChatContact[]>(['contacts'], (prev) => {
          if (prev) {
            return prev.filter(contact => contact.username !== user.username)
          }
        })

        queryClient.setQueryData(['current-chat'], null)

        queryClient.removeQueries({
          queryKey: ['messages', { username: user?.username }],
        })

        if (currentChat) {
          if (currentChat.username === user.username) {
            toast({
              description: 'You have just been removed from the contacts.',
            })
          }
        } else {
          queryClient.invalidateQueries({
            queryKey: ['strangers'],
          })
        }

        currentUrl.searchParams.delete('username')
        window.history.pushState(null, '', '/')
      })

    return () => {
      window.Echo.leave(`chat.${props.username}`)
    }
  }, [])

  function setCurrentContact() {
    const currentUrl = new URL(window.location.href)

    queryClient.setQueryData(['current-chat'], props)

    currentUrl.searchParams.set('username', props.username)
    window.history.pushState({ username: props.username }, '', currentUrl)
  }

  return (
    <label
      className={cn(
        'flex h-auto w-full cursor-pointer items-center justify-between rounded-none p-4 text-left hover:bg-secondary',
        isActive && 'bg-secondary'
      )}
    >
      <Avatar
        name={props.name}
        url={props.profile_photo_url}
        secondaryText={`@${props.username}`}
        isOnline={props.is_online}
      />
      {!!unreadMessagesCount && (
        <span className='inline-flex size-[25px] items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
          { unreadMessagesCount > 9 ? '9+' : unreadMessagesCount }
        </span>
      )}
      <input
        className='hidden'
        type='radio'
        name='contact'
        checked={isActive}
        onChange={setCurrentContact}
      />
    </label>
  )
}
