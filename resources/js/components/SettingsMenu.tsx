import { Link } from '@inertiajs/react'
import { Sun, Moon, Settings, LogOut } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { Button } from './ui/button'

export default function SettingsMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <div className='flex items-center justify-between mt-4'>
      <Button
        className='h-auto rounded-full border-gray-400 p-3 hover:bg-gray-200 dark:border-gray-500 dark:hover:bg-gray-800'
        variant='outline'
        size='icon'
      >
        <Settings size='15' />
      </Button>
      <Button
        className='h-auto rounded-full border-gray-400 p-3 hover:bg-gray-200 dark:border-gray-500 dark:hover:bg-gray-800'
        variant='outline'
        size='icon'
        onClick={setTheme.bind(null, theme === 'dark' ? 'light' : 'dark')}
      >
        { theme === 'dark' ? <Sun size='15' /> : <Moon size='15' /> }
      </Button>
      <Link
        className='rounded-full border border-gray-400 p-3 hover:bg-gray-200 dark:border-gray-500 dark:hover:bg-gray-800'
        href='/logout'
        method='post'
      >
        <LogOut size='15' />
      </Link>
    </div>
  )
}