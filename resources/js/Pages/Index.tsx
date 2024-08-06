import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import TopBar from '@/components/TopBar'

export default function Index() {
  const [loading, setLoading] = useState<boolean>(false)

  function logout() {
    router.post('/logout', {}, {
      onBefore() {
        setLoading(true)
      },
    })
  }

  return (
    <main className='flex'>
      <aside className='w-80'>
        <div className='fixed w-80 flex flex-col h-screen left-0 top-0 border-r border-border shadow-xl'>
          <h1 className='text-primary border-b border-border p-4'>Welcome, John!</h1>
          <div className='flex-1 overflow-y-auto'>
            <div className='flex items-center p-4'>
              <Avatar className='h-auto'>
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
      <div className='flex-1'>
        <TopBar />
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
      </div>
    </main>
  )
}