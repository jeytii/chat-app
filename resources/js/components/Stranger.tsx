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
      axios.post<{ user: User; }>(
        `/users/contacts/${user.username}/add`,
        null,
        { signal: abortController.current.signal },
      )
    ),
    onSuccess({ data }) {
      queryClient.setQueryData<User[]>(
        ['contacts'],
        (prev) => [ data.user, ...(prev as User[]) ],
      )
      queryClient.setQueryData(['username'], data.user.username)
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
    <Card key={user.username}>
      <CardContent className='text-center p-4'>
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