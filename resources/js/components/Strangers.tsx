import { useEffect, useRef, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import Stranger from './Stranger'
import { Input } from './ui/input'
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

  const { mutate: search } = useMutation<AxiosResponse<{ users: User[] }>, Error, string>({
    mutationFn: (query) => (
      axios.get('/users/search', {
        params: { query },
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

  if (isLoading && !data) {
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
        {data?.users.map(user =>  (
          <Stranger
            key={user.username}
            user={user}
          />
        ))}
      </div>
    </section>
  )
}