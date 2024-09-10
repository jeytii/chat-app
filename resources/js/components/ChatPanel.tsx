import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Menu, UserMinus, X } from 'lucide-react'
import axios from 'axios'
import Avatar from './Avatar'
import MessageBox from './MessageBox'
import Sidebar from './Sidebar'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import type { User } from '@/types'

export default function ChatPanel() {
  const queryClient = useQueryClient()
  const username = queryClient.getQueryData<string>(['username'])
  const user = useMemo(() => (
    queryClient.getQueryData<User[]>(['contacts'])?.find(contact => contact.username === username)
  ), [username])
  
  useQuery<User>({
    queryKey: ['chat', { username: user?.username }],
    initialData: user,
    enabled: false,
  })

  const { mutate: remove, isPending: isRemoving } = useMutation({
    mutationFn: () => axios.delete(`/users/contacts/${user?.username}/remove`),
    onSuccess() {
      queryClient.setQueryData<User[]>(
        ['contacts'],
        (prev) => prev?.filter(contact => contact.username !== user?.username) ?? []
      )

      queryClient.setQueryData(['username'], null)

      queryClient.removeQueries({
        queryKey: ['chat', { username: user?.username }]
      })
    }
  })

  function removeFromContacts() {
    remove()
  }

  function close() {
    const currentUrl = new URL(window.location.href)

    queryClient.setQueryData(['username'], null)

    currentUrl.searchParams.delete('username')
    window.history.pushState(null, '', '/')
  }

  return (
    <div className='flex h-screen flex-1 flex-col'>
      <header className='flex items-center border-b border-border px-4 py-3'>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className='mr-2 h-auto rounded-full p-2 md:hidden'
              variant='ghost'
              size='icon'
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            className='w-72 p-0'
            side='left'
          >
            <Sidebar />
          </SheetContent>
        </Sheet>

        <Avatar
          name={user?.name as string}
          url={user?.profile_photo_url}
          secondaryText='Typing...'
          isOnline
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className='ml-auto h-auto rounded-full p-3 text-destructive hover:bg-destructive/15 hover:text-destructive'
              variant='ghost'
              size='icon'
            >
              <UserMinus size='15' />
            </Button>
          </DialogTrigger>
          <DialogContent className='mx-auto w-[90%] rounded-lg'>
            <DialogHeader>
              <DialogTitle>Remove from contacts</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {user?.name} from your contacts?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant='outline'
                  disabled={isRemoving}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant='destructive'
                disabled={isRemoving}
                onClick={removeFromContacts}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          className='h-auto rounded-full p-3 hover:bg-primary/15'
          variant='ghost'
          size='icon'
          onClick={close}
        >
          <X size='15' />
        </Button>
      </header>
      <section className='flex flex-1 overflow-y-auto p-4'>
        <div className='mt-auto flex flex-col gap-2'>
          <Card className='max-w-[80%] self-start border-border text-sm text-primary'>
            <CardContent className='px-4 py-2'>
              <p>hello</p>
            </CardContent>
          </Card>
          <Card className='max-w-[80%] self-start border-border text-sm text-primary'>
            <CardContent className='px-4 py-2'>
              <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
            </CardContent>
          </Card>
          <Card className='max-w-[80%] self-end border-0 bg-secondary text-left text-sm text-primary'>
            <CardContent className='px-4 py-2'>
              <p>Hi</p>
            </CardContent>
          </Card>
          <Card className='max-w-[80%] self-end border-0 bg-secondary text-left text-sm text-primary'>
            <CardContent className='px-4 py-2'>
              <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Suscipit alias ratione, fugiat nesciunt, eos, excepturi autem quam delectus quasi incidunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat voluptatem minus ea aspernatur similique dicta laudantium soluta, neque voluptatum recusandae nulla, in error autem sint laborum non. Ex, culpa harum?</p>
            </CardContent>
          </Card>
          <div className='flex items-center gap-2 self-end'>
            <span className='text-xs text-gray-500'>Seen</span>
            <Check
              className='inline'
              color='green'
              size='15'
            />
          </div>
        </div>
      </section>

      <MessageBox />
    </div>
  )
}
