import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePage } from '@inertiajs/react'
import Sidebar from '@/components/Sidebar'
import Strangers from '@/components/Strangers'
import ChatPanelSkeleton from '@/components/skeletons/ChatPanel'
import type { PageProps } from '@inertiajs/core'
import type { User } from '@/types'

interface Props extends PageProps {
  contact: User|null;
}

const ChatPanel = lazy(() => import('@/components/ChatPanel'))

export default function Index() {
  const { contact } = usePage<Props>().props
  const { data: username } = useQuery({
    queryKey: ['username'],
    initialData: contact?.username,
    enabled: false,
  })

  return (
    <main className='flex'>
      <aside className='hidden w-72 md:block'>
        <div className='fixed left-0 top-0 h-screen w-72 border-r border-border'>
          <Sidebar />
        </div>
      </aside>

      {username ? (
        <Suspense fallback={<ChatPanelSkeleton />}>
          <ChatPanel />
        </Suspense>
      ) : (
        <Strangers />
      )}
    </main>
  )
}
