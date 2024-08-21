import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from './ui/input';

export default function SearchBox() {
  const [search, setSearch] = useState<string>('')
  const searchTimer = useRef<number>()
  const { refetch } = useQuery({
    queryKey: ['search-results'],
    async queryFn() {
      const response = await fetch(`/users/search?query=${search}`)
      const data = await response.json()

      return data.users
    }
  })

  function handleSearchQuery(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value)
  }

  useEffect(() => {
    searchTimer.current = setTimeout(() => {
      refetch()
    }, 1000)

    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current)
      }
    }
  }, [search])

  return (
    <div className='mt-4'>
      <Input
        type='text'
        placeholder='Search'
        value={search}
        onChange={handleSearchQuery}
      />
    </div>
  )
}