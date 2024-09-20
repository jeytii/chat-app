import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePage } from '@inertiajs/react'
import UserSettings from './UserSettings'
import Avatar from './Avatar'
import Contact from './Contact'
import type { PageProps } from '@inertiajs/core'
import type { ChatContact, User } from '@/types'

interface Props extends PageProps {
  user: User;
  contacts: ChatContact[];
}

export default function Sidebar() {
  const { user: authUser, contacts } = usePage<Props>().props
  const queryClient = useQueryClient()
  const { data, isSuccess } = useQuery<ChatContact[]>({
    queryKey: ['contacts'],
    initialData: contacts,
    enabled: false,
  })

  useEffect(() => {
    setTimeout(() => {
      window.Echo.join('chat')
        .here((users: User[]) => {
          const onlineUsers = users.reduce((ids: number[], user) => {
            if (user.id !== authUser.id) {
              ids.push(user.id)
            }
  
            return ids
          }, [])
  
          queryClient.setQueryData<ChatContact[]>(
            ['contacts'],
            (prev) => prev?.map(contact => ({
              ...contact,
              is_online: onlineUsers.indexOf(contact.id) !== -1,
            }))
          )
        })
        .joining((joiningUser: User) => {
          queryClient.setQueryData<ChatContact[]>(
            ['contacts'],
            (prev) => prev?.map(contact => {
              if (contact.id === joiningUser.id) {
                return {
                  ...contact,
                  is_online: true,
                }
              }
  
              return contact
            })
          )
        })
        .leaving((leavingUser: User) => {
          queryClient.setQueryData<ChatContact[]>(
            ['contacts'],
            (prev) => prev?.map(contact => {
              if (contact.id === leavingUser.id) {
                return {
                  ...contact,
                  is_online: false,
                }
              }
  
              return contact
            })
          )
        })
    }, 1000)
  }, [])

  return (
    <div className='flex h-full flex-col'>
      <div className='border-b border-border p-4'>
        <Avatar
          name={authUser.name}
          url={authUser.profile_photo_url}
        />

        <UserSettings />
      </div>

      {(isSuccess && !data.length) && (
        <p className='mt-4 px-4 text-center text-gray-500'>
          You haven&apos;t added anyone to your contacts list.
        </p>
      )}

      {(isSuccess && data.length) && (
        <div className='flex-1 overflow-y-auto'>
          {data.map(contact => (
            <Contact
              key={contact.username}
              { ...contact }
            />
          ))}
        </div>
      )}
    </div>
  )
}