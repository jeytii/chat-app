import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageProps } from '@inertiajs/core'
import { usePage } from '@inertiajs/react'
import Avatar from './Avatar'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface Props extends PageProps {
  contacts: User[];
}

export default function Contacts() {
  const { contacts } = usePage<Props>().props
  const queryClient = useQueryClient()
  const { data: contactsList, isSuccess } = useQuery<User[]>({
    queryKey: ['contacts'],
    initialData: contacts,
    enabled: false,
  })

  function setCurrentContact(contact: User) {
    const currentUrl = new URL(window.location.href)

    queryClient.setQueryData(['username'], contact.username)

    currentUrl.searchParams.append('username', contact.username)
    window.history.pushState({}, '', currentUrl)
  }

  if (!isSuccess) {
    return null
  }
  
  if (!contactsList.length) {
    return (
      <p className='text-gray-500 text-center px-4 mt-4'>
        You haven&apos;t added anyone to your contacts list.
      </p>
    )
  }

  return (
    <div className='flex-1 overflow-y-auto'>
      {contactsList.map(contact => (
        <Button
          key={contact.username}
          className={cn(
            'w-full h-auto flex items-center text-left rounded-none p-4 hover:bg-secondary',
            queryClient.getQueryData(['username']) === contact.username && 'bg-secondary'
          )}
          variant='ghost'
          onClick={setCurrentContact.bind(null, contact)}
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
  )
}