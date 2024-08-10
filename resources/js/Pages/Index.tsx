import { ChevronDown } from 'lucide-react'
import SettingsMenu from '@/components/SettingsMenu'
import AvatarWithInfo from '@/components/AvatarWithInfo'
import MessageBox from '@/components/MessageBox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'

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
              <span className='w-[25px] h-[25px] inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full ml-auto'>
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
        <section className='flex-1 flex flex-col gap-2 justify-end overflow-y-auto p-4'>
          <div>
            <Card className='inline-block max-w-[80%] border-border text-primary text-sm'>
              <CardContent className='py-2 px-4'>
                <p>hello</p>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className='inline-block max-w-[80%] border-border text-primary text-sm'>
              <CardContent className='py-2 px-4'>
                <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
              </CardContent>
            </Card>
          </div>
          <div className='text-right'>
            <Card className='inline-block max-w-[80%] bg-primary text-primary-foreground border-0 text-sm text-left'>
              <CardContent className='py-2 px-4'>
                <p>Hi</p>
              </CardContent>
            </Card>
          </div>
          <div className='text-right'>
            <Card className='inline-block max-w-[80%] bg-primary text-primary-foreground border-0 text-sm text-left'>
              <CardContent className='py-2 px-4'>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Suscipit alias ratione, fugiat nesciunt, eos, excepturi autem quam delectus quasi incidunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat voluptatem minus ea aspernatur similique dicta laudantium soluta, neque voluptatum recusandae nulla, in error autem sint laborum non. Ex, culpa harum?</p>
              </CardContent>
            </Card>
          </div>
        </section>
        <MessageBox />
      </div>
    </main>
  )
}