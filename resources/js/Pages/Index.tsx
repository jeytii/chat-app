import { useMemo } from 'react'
import { type PageProps } from '@inertiajs/core'
import { usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, UserMinus } from 'lucide-react'
import SettingsMenu from '@/components/SettingsMenu'
import AvatarWithInfo from '@/components/AvatarWithInfo'
import MessageBox from '@/components/MessageBox'
import SearchBox from '@/components/SearchBox'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface User {
  first_name: string;
  last_name: string;
  name: string;
  username: string;
  profile_photo_url?: string;
  dark_mode: boolean;
};

export default function Index() {
  const { users } = usePage<PageProps & { users: User[]; }>().props
  const { data: searchResults } = useQuery<User[]>({ queryKey: ['search-results'] })
  const people = useMemo<User[]>(
    () => searchResults?.length ? searchResults : users,
    [searchResults?.length]
  )

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

            <SearchBox />
          </div>
          {people.length ? (
            <div className='flex-1 overflow-y-auto'>
              {people.map(user => (
                <div
                  key={user.username}
                  className='flex items-center p-4'
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
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-500 text-center px-4 mt-4'>
              You haven&apos;t added anyone to your contacts list.
            </p>
          )}
        </div>
      </aside>
      <div className='flex-1 h-screen flex flex-col'>
        <header className='flex items-center justify-between border-b border-border shadow p-4'>
          <AvatarWithInfo
            name='John Doe'
            url='https://github.com/shadcn.png'
            secondaryText='Last seen 25 minutes ago'
            isOnline
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className='rounded-full text-destructive hover:text-destructive'
                variant='ghost'
              >
                <UserMinus size='20' />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove from contacts</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove John Doe from your contacts?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
                <Button variant='destructive'>Remove</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>
        <section className='flex-1 flex flex-col gap-2 justify-end overflow-y-auto p-4'>
          <div>
            <Card className='inline-block max-w-[80%] border-border text-primary text-sm'>
              <CardContent className='py-2 px-4'>
                <p>hello</p>
              </CardContent>
            </Card>
            <span className='block text-xs text-gray-500 mt-0.5'>7:30 PM</span>
          </div>
          <div>
            <Card className='inline-block max-w-[80%] border-border text-primary text-sm'>
              <CardContent className='py-2 px-4'>
                <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
              </CardContent>
            </Card>
            <span className='block text-xs text-gray-500 mt-0.5'>7:30 PM</span>
          </div>
          <div className='text-right'>
            <Card className='inline-block max-w-[80%] bg-primary text-primary-foreground border-0 text-sm text-left'>
              <CardContent className='py-2 px-4'>
                <p>Hi</p>
              </CardContent>
            </Card>
            <span className='block text-xs text-gray-500 mt-0.5'>7:30 PM</span>
          </div>
          <div className='text-right'>
            <Card className='inline-block max-w-[80%] bg-primary text-primary-foreground border-0 text-sm text-left'>
              <CardContent className='py-2 px-4'>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Suscipit alias ratione, fugiat nesciunt, eos, excepturi autem quam delectus quasi incidunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat voluptatem minus ea aspernatur similique dicta laudantium soluta, neque voluptatum recusandae nulla, in error autem sint laborum non. Ex, culpa harum?</p>
              </CardContent>
            </Card>
            <span className='block text-xs text-gray-500 mt-0.5'>7:30 PM</span>
          </div>
          <p className='text-gray-500'>Typing...</p>
        </section>
        <MessageBox />
      </div>
    </main>
  )
}
