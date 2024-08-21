import { type PageProps } from '@inertiajs/core'
import { Link, usePage } from '@inertiajs/react'
import AvatarWithInfo from '@/components/AvatarWithInfo'
import SettingsMenu from '@/components/SettingsMenu'
import SearchBox from '@/components/SearchBox'
import UsersList from '@/components/UsersList'
import { type User } from '@/types'

interface Props extends PageProps {
  user: User;
  users: User[];
}

export default function Index() {
  const { user, users } = usePage<Props>().props

  return (
    <main className='flex'>
      <aside className='w-72'>
        <div className='fixed w-72 flex flex-col h-screen left-0 top-0 border-r border-border'>
          <div className='border-b border-border p-4'>
            <AvatarWithInfo
              name={user.name}
              url={user.profile_photo_url}
            />

            <SettingsMenu />
          </div>
          {users.length ? (
            <div className='flex-1 overflow-y-auto'>
              {users.map(user => (
                <Link
                  key={user.username}
                  className='flex items-center p-4 hover:bg-secondary'
                  href='/'
                >
                  <AvatarWithInfo
                    name={user.name}
                    url={user.profile_photo_url}
                    secondaryText={user.username}
                    isOnline
                  />
                  <span className='w-[25px] h-[25px] inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full ml-auto'>
                    2
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className='text-gray-500 text-center px-4 mt-4'>
              You haven&apos;t added anyone to your contacts list.
            </p>
          )}
        </div>
      </aside>

      <section className='flex-1 px-4'>
        <div>
          <SearchBox />
          <UsersList />
        </div>
      </section>
    </main>
  )
}
