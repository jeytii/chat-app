import { useEffect, useRef, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import Stranger from './Stranger'
import StrangersSkeleton from './skeletons/Strangers'
import { Input } from './ui/input'
import { Skeleton } from './ui/skeleton'
import { useOnChangeDebounce } from '@/hooks'
import type { User } from '@/types'

export default function Strangers() {
  const queryClient = useQueryClient()
  const abortController = useRef(new AbortController())

  const { data, isLoading } = useQuery<{ users: User[] }>({
    queryKey: ['search-results'],
    async queryFn() {
      const { data } = await axios.get('/users/search')

      return data
    },
  })

  const { mutate: search, isPending: isSearching } = useMutation<AxiosResponse<{ users: User[] }>, Error, string>({
    mutationFn: (query) => (
      axios.get('/users/search', {
        params: query ? { query } : null,
        signal: abortController.current.signal,
      })
    ),
    onSuccess({ data }) {
      queryClient.setQueryData(['search-results'], { users: data.users })
    }
  })

  useEffect(() => {
    return () => {
      abortController.current.abort()
      queryClient.resetQueries({
        queryKey: ['search-results'],
      })
    }
  }, [])

  const debouncedHandleSearch = useOnChangeDebounce(handleSearch)

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    search(event.target.value)
  }

  if (isLoading) {
    return (
      <section className='flex-1 p-4'>
        <Skeleton className='h-[38px]' />
        <StrangersSkeleton />
      </section>
    )
  }

  return (
    <section className='flex-1 p-4'>
      <Input
        type='text'
        placeholder='Search'
        onChange={debouncedHandleSearch}
      />
      {isSearching ? (
        <StrangersSkeleton />
      ) : (
        <div className='mt-4 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4'>
          {data?.users.map(user =>  (
            <Stranger
              key={user.username}
              user={user}
            />
          ))}
        </div>
      )}
    </section>
  )
}