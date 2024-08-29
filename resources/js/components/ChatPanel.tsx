import { type MouseEventHandler } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserMinus, X } from 'lucide-react'
import MiniProfile from './MiniProfile'
import MessageBox from './MessageBox'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { User } from '@/types'

interface Props {
  user: User;
  close: MouseEventHandler<HTMLButtonElement>;
}

export default function ChatPanel({ user, close }: Props) {
  const { data } = useQuery<any, Error, User>({
    queryKey: ['chat', { username: user.username }],
    queryFn() {
      return user
    },
  })

  return (
    <div className='flex-1 h-screen flex flex-col'>
      <header className='flex items-center border-b border-border shadow p-4'>
        <MiniProfile
          name={user.name}
          url={user.profile_photo_url}
          secondaryText='Last seen 25 minutes ago'
          isOnline
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className='rounded-full ml-auto text-destructive hover:text-destructive'
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
        <Button
          className='rounded-full'
          variant='ghost'
          onClick={close}
        >
          <X size='20' />
        </Button>
      </header>
      <section className='flex-1 flex overflow-y-auto p-4'>
        <div className='flex flex-col gap-2 mt-auto'>
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
        </div>
      </section>

      <MessageBox />
    </div>
  )
}