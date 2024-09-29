import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios, { type AxiosResponse } from 'axios'
import { Menu } from 'lucide-react'
import Stranger from './Stranger'
import StrangersSkeleton from './skeletons/Strangers'
import Sidebar from './Sidebar'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Input } from './ui/input'
import { Skeleton } from './ui/skeleton'
import { useOnChangeDebounce } from '@/hooks'
import type { User } from '@/types'

export default function Strangers() {
  const queryClient = useQueryClient()
  const abortController = useRef(new AbortController())

  const { data, isLoading } = useQuery<User[]>({
    queryKey: ['search-results'],
    async queryFn() {
      const { data } = await axios.get('/users/search')

      return data.users
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
      queryClient.setQueryData(['search-results'], data.users)
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

  const debouncedHandleSearch = useOnChangeDebounce((event) => {
    search(event.target.value)
  })

  if (isLoading) {
    return (
      <section className='flex-1 p-4'>
        <div className='flex'>
          <Skeleton className='mr-2 size-[38px] rounded-full' />
          <Skeleton className='h-[38px] flex-1' />
        </div>
        <StrangersSkeleton />
      </section>
    )
  }

  return (
    <section className='flex-1 p-4'>
      <header className='flex gap-2'>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className='h-auto rounded-full md:hidden'
              variant='ghost'
              size='icon'
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            className='w-72 p-0'
            side='left'
          >
            <Sidebar />
          </SheetContent>
        </Sheet>

        <Input
          type='text'
          placeholder='Search'
          onChange={debouncedHandleSearch}
        />
      </header>
      {isSearching ? (
        <StrangersSkeleton />
      ) : (
        <div className='mt-4 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4'>
          {data?.map(user =>  (
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