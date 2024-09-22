import { useQueryClient } from '@tanstack/react-query'
import Avatar from './Avatar'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { ChatContact } from '@/types'

export default function Contact(props: ChatContact) {
  const queryClient = useQueryClient()

  function setCurrentContact() {
    const currentUrl = new URL(window.location.href)

    queryClient.setQueryData(['current-chat'], props)

    currentUrl.searchParams.set('username', props.username)
    window.history.pushState({ username: props.username }, '', currentUrl)
  }

  return (
    <Button
      className={cn(
        'flex h-auto w-full items-center rounded-none p-4 text-left hover:bg-secondary',
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
      <span className='ml-auto inline-flex size-[25px] items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
        2
      </span>
    </Button>
  )
}