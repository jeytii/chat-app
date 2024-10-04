import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import Avatar from './Avatar'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import type { User } from '@/types'

export default function Stranger({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const abortController = useRef(new AbortController())
  const { mutate: add, isPending } = useMutation<AxiosResponse<{ user: User; }>>({
    mutationFn: () => (
      axios.post(
        `/users/contacts/${user.username}/add`,
        null,
        { signal: abortController.current.signal },
      )
    ),
    onSuccess(response) {
      const { user } = response.data
      const currentUrl = new URL(window.location.href)
      const onlineUsers = queryClient.getQueryData<string[]>(['online-users'])
      const isOnline = onlineUsers?.indexOf(user.username) !== -1

      queryClient.setQueryData<User[]>(['contacts'], (prev) => {
        if (prev) {
          return [
            {
              ...user,
              is_online: isOnline,
              unread_messages_count: 0,
            },
            ...prev,
          ]
        }
      })

      queryClient.setQueryData(['current-chat'], {
        ...user,
        is_online: isOnline,
        unread_messages_count: 0,
      })

      currentUrl.searchParams.set('username', user.username)
      window.history.pushState({ username: user.username }, '', currentUrl)
    }
  })

  useEffect(() => {
    return () => {
      abortController.current.abort()
    }
  }, [])

  function addToContacts() {
    add()
  }

  return (
    <Card
      key={user.username}
      className='shadow-lg'
    >
      <CardContent className='p-4 text-center'>
        <Avatar
          name={user.name}
          url={user.profile_photo_url}
          imageSize={80}
          secondaryText={`@${user.username}`}
          alignment='vertical'
        />
      </CardContent>
      <CardFooter>
        <Button
          className='mx-auto'
          size='sm'
          disabled={isPending}
          onClick={addToContacts}
        >
          Add and say hi
        </Button>
      </CardFooter>
    </Card>
  )
}