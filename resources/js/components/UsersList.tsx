import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import MiniProfile from './MiniProfile'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import type { User } from '@/types'

export default function UsersList() {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery<any, Error, User[]>({
    queryKey: ['search-results'],
  })

  const { mutate, isPending } = useMutation<User, Error, User>({
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

  function handleAdd(user: User) {
    mutate(user)
  }

  if (isLoading && !users) {
    return null
  }

  return (
    <div className='grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-4'>
      {users?.map(user => (
        <Card key={user.username}>
          <CardContent className='text-center p-4'>
            <MiniProfile
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
              onClick={handleAdd.bind(null, user)}
            >
              Add and say hi
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}