import { ChevronDown } from 'lucide-react'
import SettingsMenu from '@/components/SettingsMenu'
import AvatarWithInfo from '@/components/AvatarWithInfo'
import MessageBox from '@/components/MessageBox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function Index() {
  return (
    <main className='flex'>
      <aside className='w-80'>
        <div className='fixed w-80 flex flex-col h-screen left-0 top-0 border-r border-border'>
          <div className='border-b border-border p-4'>
            <div className='flex items-center justify-between'>
              <AvatarWithInfo
                name='John Doe'
                url='https://github.com/shadcn.png'
              />
              <Popover>
                <PopoverTrigger>
                  <ChevronDown size='20' />
                </PopoverTrigger>
                <PopoverContent
                  className='w-auto p-0'
                  align='end'
                >
                  <SettingsMenu />
                </PopoverContent>
              </Popover>
            </div>
            <div className='mt-4'>
              <Input
                type='text'
                className='h-auto text-primary bg-secondary border border-border py-1 px-2'
                placeholder='Search'
              />
            </div>
          </div>
          <div className='flex-1 overflow-y-auto'>
            <div className='flex items-center p-4'>
              <AvatarWithInfo
                name='John Doe'
                url='https://github.com/shadcn.png'
                isOnline
              />
              <span className='w-[25px] h-[25px] inline-flex items-center justify-center bg-secondary-foreground text-secondary text-xs rounded-full ml-auto'>
                2
              </span>
            </div>
          </div>
        </div>
      </aside>
      <div className='flex-1 h-screen flex flex-col'>
        <header className='border-b border-border shadow p-4'>
          <AvatarWithInfo
            name='John Doe'
            url='https://github.com/shadcn.png'
            status='Online'
            isOnline
          />
        </header>
        <section className='flex-1 overflow-y-auto p-4'>
          <h1>Index page</h1>
        </section>
        <section className='border-t border-border p-4'>
          <MessageBox />
        </section>
      </div>
    </main>
  )
}