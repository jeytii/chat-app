import { useEffect, useRef, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageProps } from '@inertiajs/core'
import { usePage } from '@inertiajs/react'
import axios from 'axios'
import Stranger from './Stranger'
import { Input } from './ui/input'
import { useOnChangeDebounce } from '@/hooks'
import type { User } from '@/types'

interface Props extends PageProps {
  strangers: User[];
}

export default function Strangers() {
  const { strangers } = usePage<Props>().props
  const queryClient = useQueryClient()
  const abortController = useRef(new AbortController())

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['search-results'],
    initialData: strangers,
    enabled: false,
  })

  const { mutate: search } = useMutation<any, Error, string>({
    async mutationFn(query) {
      const { data } = await axios.get<{ users: User[]; }>(
        '/users/search',
        {
          params: { query },
          signal: abortController.current.signal,
        },
      )

      return data.users
    },
    onSuccess(users) {
      queryClient.setQueryData(['search-results'], users)
    }
  })

  useEffect(() => {
    return () => {
      abortController.current.abort()
      reset()
    }
  }, [])

  const debouncedHandleSearch = useOnChangeDebounce(handleSearch)

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target

    if (value.length) {
      search(value)
    } else {
      reset()
    }
  }

  function reset() {
    queryClient.resetQueries({
      queryKey: ['search-results'],
    })
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
        {users?.map(user =>  (
          <Stranger
            key={user.username}
            user={user}
          />
        ))}
      </div>
    </section>
  )
}