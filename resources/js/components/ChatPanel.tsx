import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserMinus, X } from 'lucide-react'
import axios from 'axios'
import Avatar from './Avatar'
import MessageBox from './MessageBox'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
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
      <header className='flex items-center border-b border-border px-4 py-3 shadow'>
        <Avatar
          name={user?.name as string}
          url={user?.profile_photo_url}
          secondaryText='Last seen 25 minutes ago'
          isOnline
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className='ml-auto h-auto rounded-full p-3 text-destructive hover:text-destructive'
              variant='ghost'
              size='icon'
            >
              <UserMinus size='15' />
            </Button>
          </DialogTrigger>
          <DialogContent>
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
          className='h-auto rounded-full p-3'
          variant='ghost'
          size='icon'
          onClick={close}
        >
          <X size='15' />
        </Button>
      </header>
      <section className='flex flex-1 overflow-y-auto p-4'>
        <div className='mt-auto flex flex-col gap-2'>
          <div>
            <Card className='inline-block max-w-[80%] border-border text-sm text-primary'>
              <CardContent className='px-4 py-2'>
                <p>hello</p>
              </CardContent>
            </Card>
            <span className='mt-0.5 block text-xs text-gray-500'>7:30 PM</span>
          </div>
          <div>
            <Card className='inline-block max-w-[80%] border-border text-sm text-primary'>
              <CardContent className='px-4 py-2'>
                <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit.</p>
              </CardContent>
            </Card>
            <span className='mt-0.5 block text-xs text-gray-500'>7:30 PM</span>
          </div>
          <div className='text-right'>
            <Card className='inline-block max-w-[80%] border-0 bg-primary text-left text-sm text-primary-foreground'>
              <CardContent className='px-4 py-2'>
                <p>Hi</p>
              </CardContent>
            </Card>
            <span className='mt-0.5 block text-xs text-gray-500'>7:30 PM</span>
          </div>
          <div className='text-right'>
            <Card className='inline-block max-w-[80%] border-0 bg-primary text-left text-sm text-primary-foreground'>
              <CardContent className='px-4 py-2'>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Suscipit alias ratione, fugiat nesciunt, eos, excepturi autem quam delectus quasi incidunt. Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat voluptatem minus ea aspernatur similique dicta laudantium soluta, neque voluptatum recusandae nulla, in error autem sint laborum non. Ex, culpa harum?</p>
              </CardContent>
            </Card>
            <span className='mt-0.5 block text-xs text-gray-500'>7:30 PM</span>
          </div>
          <p className='text-gray-500'>Typing...</p>
        </div>
      </section>

      <MessageBox />
    </div>
  )
}
