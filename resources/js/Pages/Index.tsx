import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PageProps } from '@inertiajs/core'
import { usePage } from '@inertiajs/react'
import Avatar from '@/components/Avatar'
import UserSettings from '@/components/UserSettings'
import Strangers from '@/components/Strangers'
import Contacts from '@/components/Contacts'
import type { User } from '@/types'

interface Props extends PageProps {
  user: User;
  contact: User|null;
}

const ChatPanel = lazy(() => import('@/components/ChatPanel'))

export default function Index() {
  const { user, contact } = usePage<Props>().props
  const { data: username } = useQuery({
    queryKey: ['username'],
    initialData: contact?.username,
    enabled: false,
  })

  return (
    <main className='flex'>
      <aside className='w-72'>
        <div className='fixed left-0 top-0 flex h-screen w-72 flex-col border-r border-border'>
          <div className='border-b border-border p-4'>
            <Avatar
              name={user.name}
              url={user.profile_photo_url}
            />

            <UserSettings />
          </div>

          <Contacts />
        </div>
      </aside>

      {username ? (
        <Suspense>
          <ChatPanel />
        </Suspense>
      ) : (
        <Strangers />
      )}
    </main>
  )
}
