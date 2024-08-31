import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type PageProps } from '@inertiajs/core'
import { usePage } from '@inertiajs/react'
import Avatar from '@/components/Avatar'
import UserSettings from '@/components/UserSettings'
import SearchBox from '@/components/SearchBox'
import UsersList from '@/components/UsersList'
import ChatPanel from '@/components/ChatPanel'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'

interface Props extends PageProps {
  user: User;
}

export default function Index() {
  const { user } = usePage<Props>().props
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const { data: contacts, isSuccess } = useQuery<any, Error, User[]>({
    queryKey: ['contacts'],
    async queryFn() {
      const response = await fetch('/users/contacts')
      const data = await response.json()

      return data.users
    }
  })
  const currentUser = useMemo(
    () => currentUsername ? contacts?.find(contact => contact.username === currentUsername) : null,
    [currentUsername]
  )

  return (
    <main className='flex'>
      <aside className='w-72'>
        <div className='fixed w-72 flex flex-col h-screen left-0 top-0 border-r border-border'>
          <div className='border-b border-border p-4'>
            <Avatar
              name={user.name}
              url={user.profile_photo_url}
            />

            <UserSettings />
          </div>
          {isSuccess ? (
            <div className='flex-1 overflow-y-auto'>
              {contacts.map(contact => (
                <Button
                  key={contact.username}
                  className='w-full h-auto flex items-center text-left rounded-none p-4 hover:bg-secondary'
                  variant='ghost'
                  onClick={setCurrentUsername.bind(null, contact.username)}
                >
                  <Avatar
                    name={contact.name}
                    url={contact.profile_photo_url}
                    secondaryText={`@${contact.username}`}
                    isOnline
                  />
                  <span className='w-[25px] h-[25px] inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full ml-auto'>
                    2
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <p className='text-gray-500 text-center px-4 mt-4'>
              You haven&apos;t added anyone to your contacts list.
            </p>
          )}
        </div>
      </aside>

      {currentUser ? (
        <ChatPanel
          user={currentUser}
          close={setCurrentUsername.bind(null, null)}
        />
      ) : (
        <section className='flex-1 px-4'>
          <div>
            <SearchBox />
            <UsersList />
          </div>
        </section>
      )}
    </main>
  )
}
