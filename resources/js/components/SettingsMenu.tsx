import { Link } from '@inertiajs/react'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { Button } from './ui/button'

export default function SettingsMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <Button
        className='h-auto w-full flex items-center justify-start rounded-b-none'
        variant='ghost'
        onClick={setTheme.bind(null, theme === 'dark' ? 'light' : 'dark')}
      >
        { theme === 'dark' ? <Sun size='20' /> : <Moon size='20' /> }

        <span className='ml-4'>
          {theme === 'dark' ? 'Light' : 'Dark'} mode
        </span>
      </Button>
      <Link
        href='/logout'
        method='post'
        as='button'
        type='button'
        className='h-auto w-full flex items-center justify-start text-sm font-medium px-4 py-2 hover:bg-accent hover:text-accent-foreground'
      >
        <LogOut size='20' />
        <span className='ml-4'>Sign out</span>
      </Link>
    </div>
  )
}