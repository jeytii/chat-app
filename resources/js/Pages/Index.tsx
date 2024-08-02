import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Index() {
  const [loading, setLoading] = useState<boolean>(false)

  function logout() {
    router.post('/logout', {}, {
      onBefore() {
        setLoading(true)
      }
    })
  }

  return (
    <main className='flex bg-primary-foreground'>
      <aside className='w-80 bg-white'>
        <div className='fixed w-80 flex flex-col h-screen left-0 top-0 shadow-xl'>
          <h1 className='text-primary px-4 mt-4'>Welcome, John!</h1>
          <div className='px-4 mt-4'>
            <Input
              type='text'
              className='h-auto border-primary p-2'
              placeholder='Search'
            />
          </div>
          <div className='flex-1 overflow-y-auto px-4 mt-4'>
            <div className='flex items-center mt-4'>
              <Avatar>
                <AvatarImage
                  className='w-[40px] h-[40px] rounded-full'
                  src='https://github.com/shadcn.png'
                  alt='@shadcn'
                />
                <AvatarFallback className='w-[40px] h-[40px] rounded-full'>JD</AvatarFallback>
              </Avatar>
              <label className='text-primary ml-2'>John Doe</label>
              <span className='bg-secondary-foreground text-secondary text-xs rounded-full py-1 px-2 ml-auto'>2</span>
            </div>
          </div>
        </div>
      </aside>
      <div className='p-4'>
        <h1>Index page</h1>
        {loading ? (
          <Button
            disabled
          >
            <Loader2 className='animate-spin' />
            <span className='ml-2'>Logging out</span>
          </Button>
        ) : (
          <Button
            size='sm'
            onClick={logout}
          >
            Logout
          </Button>
        )}
      </div>
    </main>
  )
}