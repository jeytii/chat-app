import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Avatar from './Avatar'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import type { User } from '@/types'

export default function Stranger({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const abortController = useRef(new AbortController())
  const { mutate: add, isPending } = useMutation<User, Error, User>({
    async mutationFn({ username }) {
      const { data } = await axios.post<{ user: User; }>(
        'users/contacts/store',
        { username },
        { signal: abortController.current.signal },
      )

      return data.user
    },
    onSuccess(newContact) {
      queryClient.setQueryData<User[]>(
        ['contacts'],
        (prev) => [newContact, ...(prev as User[])],
      )
      queryClient.setQueryData<User[]>(
        ['search-results'],
        (prev) => prev?.filter(user => user.username !== newContact.username)
      )
    }
  })

  useEffect(() => {
    return () => {
      abortController.current.abort()
    }
  }, [])

  function addToContacts() {
    add(user)
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