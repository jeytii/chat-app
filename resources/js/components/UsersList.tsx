import { type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Avatar from './Avatar'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useOnChangeDebounce } from '@/hooks'
import type { User } from '@/types'

export default function UsersList() {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['search-results'],
    async queryFn({ signal }) {
      const response = await fetch(`/users/search`, { signal })
      const data = await response.json()

      return data.users
    }
  })

  const { mutate: search } = useMutation<any, Error, string>({
    async mutationFn(query) {
      const response = await fetch(`/users/search?query=${query}`)
      const data = await response.json()

      return data.users
    },
    onSuccess(users) {
      queryClient.setQueryData(['search-results'], users)
    }
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

  const debouncedHandleSearch = useOnChangeDebounce(handleSearch)

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    search(event.target.value)
  }

  function handleAdd(user: User) {
    mutate(user)
  }

  if (isLoading && !users) {
    return null
  }

  return (
    <section className='flex-1 p-4'>
      <Input
        type='text'
        placeholder='Search'
        onChange={debouncedHandleSearch}
      />
      <div className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mt-4'>
        {users?.map(user => (
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
                onClick={handleAdd.bind(null, user)}
              >
                Add and say hi
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}