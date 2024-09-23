import { Skeleton } from '../ui/skeleton'

export default function StrangersSkeleton() {
  return (
    <div className='mt-4 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4'>
      <div className='flex flex-col rounded-lg border p-4'>
        <Skeleton className='mx-auto size-[80px] rounded-full' />
        <div className='mt-2 space-y-2'>
          <Skeleton className='mx-auto h-4 w-[150px]' />
          <Skeleton className='mx-auto h-4 w-[100px]' />
        </div>
        <Skeleton className='mx-auto mt-4 h-8 w-[120px]' />
      </div>
      <div className='flex flex-col rounded-lg border p-4'>
        <Skeleton className='mx-auto size-[80px] rounded-full' />
        <div className='mt-2 space-y-2'>
          <Skeleton className='mx-auto h-4 w-[150px]' />
          <Skeleton className='mx-auto h-4 w-[100px]' />
        </div>
        <Skeleton className='mx-auto mt-4 h-8 w-[120px]' />
      </div>
      <div className='flex flex-col rounded-lg border p-4'>
        <Skeleton className='mx-auto size-[80px] rounded-full' />
        <div className='mt-2 space-y-2'>
          <Skeleton className='mx-auto h-4 w-[150px]' />
          <Skeleton className='mx-auto h-4 w-[100px]' />
        </div>
        <Skeleton className='mx-auto mt-4 h-8 w-[120px]' />
      </div>
      <div className='flex flex-col rounded-lg border p-4'>
        <Skeleton className='mx-auto size-[80px] rounded-full' />
        <div className='mt-2 space-y-2'>
          <Skeleton className='mx-auto h-4 w-[150px]' />
          <Skeleton className='mx-auto h-4 w-[100px]' />
        </div>
        <Skeleton className='mx-auto mt-4 h-8 w-[120px]' />
      </div>
    </div>
  )
}