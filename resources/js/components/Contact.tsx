import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Avatar from './Avatar'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { ChatContact } from '@/types'

export default function Contact(props: ChatContact) {
  const queryClient = useQueryClient()
  const unreadMessagesCount = props.unread_messages_count

  useEffect(() => {
    window.Echo.private(`count-unread-messages.${props.username}`)
      .listen('MessageSent', () => {
        const currentChat = queryClient.getQueryData<ChatContact>(['current-chat'])

        if (!currentChat || currentChat.username !== props.username) {
          queryClient.setQueryData<ChatContact[]>(['contacts'], (prev) => (
            prev?.map(contact => ({
              ...contact,
              unread_messages_count: contact.unread_messages_count + 1,
            }))   
          ))
        } else {
          axios.put('messages/mark-as-read', {
            username: props.username
          })
        }
      })

    return () => {
      window.Echo.leave(`count-unread-messages.${props.username}`)
    }
  }, [])

  function setCurrentContact() {
    const currentUrl = new URL(window.location.href)

    queryClient.setQueryData(['current-chat'], props)

    currentUrl.searchParams.set('username', props.username)
    window.history.pushState({ username: props.username }, '', currentUrl)
  }

  return (
    <Button
      className={cn(
        'flex h-auto w-full items-center justify-between rounded-none p-4 text-left hover:bg-secondary',
        queryClient.getQueryData<ChatContact>(['current-chat'])?.username === props.username && 'bg-secondary'
      )}
      variant='ghost'
      onClick={setCurrentContact}
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
    </Button>
  )
}