import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Menu, UserMinus, X } from 'lucide-react'
import axios from 'axios'
import Avatar from './Avatar'
import MessageBox from './MessageBox'
import Sidebar from './Sidebar'
import Messages from './Messages'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import type { ChatContact } from '@/types'

export default function ChatPanel() {
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<ChatContact>(['current-chat'])

  const { mutate: remove, isPending: isRemoving } = useMutation({
    mutationFn: () => axios.delete(`/users/contacts/${user?.username}/remove`),
    onSuccess() {
      queryClient.setQueryData<ChatContact[]>(
        ['contacts'],
        (prev) => prev?.filter(contact => contact.username !== user?.username) ?? []
      )

      queryClient.setQueryData(['current-chat'], null)

      queryClient.removeQueries({
        queryKey: ['messages', { username: user?.username }]
      })
    }
  })

  function removeFromContacts() {
    remove()
  }

  function close() {
    const currentUrl = new URL(window.location.href)

    queryClient.setQueryData(['current-chat'], null)

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
          secondaryText={user?.is_online ? 'Online' : 'Offline'}
          isOnline={user?.is_online}
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
      
      <Messages />

      <MessageBox />
    </div>
  )
}
