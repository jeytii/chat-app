import { Skeleton } from '../ui/skeleton'

export default function ChatPanelSkeleton() {
  return (
    <section className='flex h-screen flex-1 flex-col'>
      <header className='flex items-center gap-2 border-b px-4 py-3'>
        <Skeleton className='size-[45px] rounded-full' />
        <div>
          <Skeleton className='h-3 w-[150px]' />
          <Skeleton className='mt-2 h-3 w-[180px]' />
        </div>
        <Skeleton className='ml-auto mr-1 size-8 rounded-full' />
        <Skeleton className='size-8 rounded-full' />
      </header>
      <div className='flex flex-1 flex-col-reverse gap-4 p-4'>
        <Skeleton className='h-20 w-4/5 self-end' />
        <Skeleton className='h-8 w-[70%] self-end' />
        <Skeleton className='h-8 w-2/5 self-end' />
        <Skeleton className='h-20 w-4/5' />
        <Skeleton className='h-8 w-2/5' />
      </div>
      <Skeleton className='h-[90px] rounded-none border-t' />
    </section>
  )
}