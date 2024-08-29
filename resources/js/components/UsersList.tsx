import { useQuery } from '@tanstack/react-query'
import MiniProfile from './MiniProfile'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import type { User } from '@/types'

export default function UsersList() {
  const { data: users, isLoading } = useQuery<any, Error, User[]>({
    queryKey: ['search-results'],
  })

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
            >
              Add and say hi
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}