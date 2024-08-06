import { router } from '@inertiajs/react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Sun, Moon, LogOut } from 'lucide-react'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useTheme } from './ThemeProvider'

export default function TopBar() {
  const { theme, setTheme } = useTheme()

  function logout () {
    router.post('/logout')
  }

  return (
    <section className='border-b border-border shadow-md'>
      <nav className='flex items-center justify-between border-b border-border py-2 px-4'>
        <Input
          type='text'
          className='h-auto max-w-[300px] text-primary border-primary py-1 px-2'
          placeholder='Search'
        />
        <Popover>
          <PopoverTrigger>
            <button className='block'>
              <Avatar className='h-auto'>
                <AvatarImage
                  className='w-[40px] h-[40px] rounded-full'
                  src='https://github.com/shadcn.png'
                  alt='@shadcn'
                />
                <AvatarFallback className='w-[40px] h-[40px] rounded-full'>JD</AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-max overflow-hidden p-0 mr-4'>
            <div>
              <Button
                className='h-auto w-full flex items-center justify-start'
                variant='ghost'
                onClick={setTheme.bind(null, theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun size='20' />
                ) : (
                  <Moon size='20' />
                )}

                <span className='ml-4'>
                  {theme === 'dark' ? 'Light' : 'Dark'} mode
                </span>
              </Button>
              <Button
                className='h-auto w-full flex items-center justify-start'
                variant='ghost'
                onClick={logout}
              >
                <LogOut size='20' />
                <span className='ml-4'>Sign out</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
      <nav className='py-2 px-4'>
        <h1 className='text-primary'>John Doe</h1>
      </nav>
    </section>
  )
}