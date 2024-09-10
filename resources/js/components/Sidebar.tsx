import { usePage } from '@inertiajs/react'
import Avatar from './Avatar'
import Contacts from './Contacts'
import UserSettings from './UserSettings'
import type { PageProps } from '@inertiajs/core'
import type { User } from '@/types'

interface Props extends PageProps {
  user: User;
}

export default function Sidebar() {
  const { user } = usePage<Props>().props

  return (
    <div className='flex h-full flex-col'>
      <div className='border-b border-border p-4'>
        <Avatar
          name={user.name}
          url={user.profile_photo_url}
        />

        <UserSettings />
      </div>

      <Contacts />
    </div>
  )
}