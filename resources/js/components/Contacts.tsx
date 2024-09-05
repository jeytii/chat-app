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

    currentUrl.searchParams.set('username', contact.username)
    window.history.pushState({ username: contact.username }, '', currentUrl)
  }

  if (!isSuccess) {
    return null
  }
  
  if (!contactsList.length) {
    return (
      <p className='mt-4 px-4 text-center text-gray-500'>
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
            'flex h-auto w-full items-center rounded-none p-4 text-left hover:bg-secondary',
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
          <span className='ml-auto inline-flex size-[25px] items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
            2
          </span>
        </Button>
      ))}
    </div>
  )
}