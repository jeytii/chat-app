import { lazy, Suspense, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePage } from '@inertiajs/react'
import Sidebar from '@/components/Sidebar'
import Strangers from '@/components/Strangers'
import ChatPanelSkeleton from '@/components/skeletons/ChatPanel'
import type { PageProps } from '@inertiajs/core'
import type { ChatContact, User } from '@/types'

interface Props extends PageProps {
  user: User;
  contact: ChatContact|null;
}

const ChatPanel = lazy(() => import('@/components/ChatPanel'))

export default function Index() {
  const { user: authUser, contact } = usePage<Props>().props
  const queryClient = useQueryClient()

  const { data: currentChat } = useQuery<ChatContact|null>({
    queryKey: ['current-chat'],
    initialData: contact,
    enabled: false,
  })

  useQuery<string[]>({
    queryKey: ['online-users'],
    initialData: [],
    enabled: false,
  })

  useEffect(() => {
    window.Echo.join('app')
      .here((users: User[]) => {
        const currentChat = queryClient.getQueryData<ChatContact>(['current-chat'])
        
        if (currentChat) {
          const fetchedContact = users.find(user => user.username === currentChat.username)
          
          if (fetchedContact) {
            updateCurrentChatStatus(fetchedContact, true)
          }
        }

        queryClient.setQueryData<ChatContact[]>(['contacts'], (prev) => {
          if (prev) {
            return prev.map(contact => ({
              ...contact,
              is_online: !!users.find(user => user.username === contact.username),
            }))
          }
        })

        queryClient.setQueryData<string[]>(
          ['online-users'],
          users.map(user => user.username)
        )
      })
      .joining((joiningUser: User) => {
        updateCurrentChatStatus(joiningUser, true)
        updateContactsStatuses(joiningUser, true)

        queryClient.setQueryData<string[]>(['online-users'], (prev) => {
          if (prev) {
            return [ ...prev, joiningUser.username ]
          }
        })
      })
      .leaving((leavingUser: User) => {
        updateCurrentChatStatus(leavingUser, false)
        updateContactsStatuses(leavingUser, false)

        queryClient.setQueryData<string[]>(['online-users'], (prev) => {
          if (prev) {
            return prev.filter(username => username !== leavingUser.username)
          }
        })
      })

    window.Echo.private(`chat.${authUser.username}`)
      .listen('AddedToContacts', ({ user: newContact }: { user: ChatContact; }) => {
        const onlineUsers = queryClient.getQueryData<string[]>(['online-users'])

        queryClient.setQueryData<ChatContact[]>(['contacts'], (prev) => {
          if (prev) {
            return [
              {
                ...newContact,
                is_online: onlineUsers?.indexOf(newContact.username) !== -1,
                unread_messages_count: 0,
              },
              ...prev,
            ]
          }
        })

        queryClient.setQueryData<User[]>(['strangers'], (prev) => {
          if (prev) {
            return prev.filter(user => user.username !== newContact.username)
          }
        })
      })
  }, [])

  function updateCurrentChatStatus(user: User, isOnline: boolean) {
    queryClient.setQueryData<ChatContact>(['current-chat'], (prev) => {
      if (!prev) {
        return undefined
      }

      if (user.username === prev.username) {
        return {
          ...prev,
          is_online: isOnline,
        }
      }

      return prev
    })
  }

  function updateContactsStatuses(user: User, isOnline: boolean) {
    queryClient.setQueryData<ChatContact[]>(['contacts'], (prev) => {
      if (prev) {
        return prev.map(contact => {
          if (contact.username === user.username) {
            return { ...contact, is_online: isOnline }
          }
  
          return contact
        })
      }
    })
  }

  return (
    <main className='flex'>
      <aside className='hidden w-72 md:block'>
        <div className='fixed left-0 top-0 h-screen w-72 border-r border-border'>
          <Sidebar />
        </div>
      </aside>

      {currentChat ? (
        <Suspense fallback={<ChatPanelSkeleton />}>
          <ChatPanel />
        </Suspense>
      ) : (
        <Strangers />
      )}
    </main>
  )
}
