import { useMutation, useQueryClient } from '@tanstack/react-query'
import Avatar from './Avatar'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import type { User } from '@/types'

export default function Stranger({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const { mutate: add, isPending } = useMutation<User, Error, User>({
    async mutationFn({ username }) {
      const response = await fetch('users/contacts/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      })
      const data = await response.json()

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