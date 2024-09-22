import { lazy, Suspense, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePage } from '@inertiajs/react'
import Sidebar from '@/components/Sidebar'
import Strangers from '@/components/Strangers'
import ChatPanelSkeleton from '@/components/skeletons/ChatPanel'
import type { PageProps } from '@inertiajs/core'
import type { ChatContact, User } from '@/types'

interface Props extends PageProps {
  contact: ChatContact|null;
}

const ChatPanel = lazy(() => import('@/components/ChatPanel'))

export default function Index() {
  const { contact } = usePage<Props>().props
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['current-chat'],
    initialData: contact,
    enabled: false,
  })

  useEffect(() => {
    window.Echo.join('chat')
      .here((users: User[]) => {
        const currentChat = queryClient.getQueryData<ChatContact>(['current-chat'])
        
        if (currentChat) {
          const fetchedContact = users.find(user => user.username === currentChat.username)
          
          if (fetchedContact) {
            updateCurrentChatStatus(fetchedContact, true)
          }
        }

        queryClient.setQueryData<ChatContact[]>(
          ['contacts'],
          (prev) => prev?.map(contact => ({
            ...contact,
            is_online: !!users.find(user => user.username === contact.username),
          }))
        )
      })
      .joining((joiningUser: User) => {
        updateCurrentChatStatus(joiningUser, true)
        updateContactsStatuses(joiningUser, true)
      })
      .leaving((leavingUser: User) => {
        updateCurrentChatStatus(leavingUser, false)
        updateContactsStatuses(leavingUser, false)
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
    queryClient.setQueryData<ChatContact[]>(['contacts'], (prev) => (
      prev?.map(contact => {
        if (contact.username === user.username) {
          return {
            ...contact,
            is_online: isOnline,
          }
        }

        return contact
      })
    ))
  }

  return (
    <main className='flex'>
      <aside className='hidden w-72 md:block'>
        <div className='fixed left-0 top-0 h-screen w-72 border-r border-border'>
          <Sidebar />
        </div>
      </aside>

      {data ? (
        <Suspense fallback={<ChatPanelSkeleton />}>
          <ChatPanel />
        </Suspense>
      ) : (
        <Strangers />
      )}
    </main>
  )
}
