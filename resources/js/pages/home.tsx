import { MessagesSquare } from 'lucide-react'

export default function Home() {
    return (
        <div className='flex h-full items-center justify-center'>
            <div className='max-w-xs space-y-4 px-4 text-center text-muted-foreground'>
                <MessagesSquare size={140} className='mx-auto' />
                <p className='text-lg'>Select a contact from the sidebar to start chatting with</p>
            </div>
        </div>
    )
}
