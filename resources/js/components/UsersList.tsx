import { useQuery } from '@tanstack/react-query'
import { type User } from '@/types'
import { Card, CardContent } from './ui/card'
import AvatarWithInfo from './AvatarWithInfo'

export default function UsersList() {
  const { data: users, isLoading } = useQuery<any, Error, User[]>({
    queryKey: ['search-results'],
  })

  if (isLoading && !users) {
    return null
  }

  return (
    <div className='grid grid-cols-4 gap-4 mt-4'>
      {users?.map(user => (
        <Card>
          <CardContent className='text-center p-4'>
            <AvatarWithInfo
              name={user.name}
              url={user.profile_photo_url}
              imageSize={80}
              secondaryText={`@${user.username}`}
              alignment='vertical'
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}