import { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface Props {
  name: string;
  url?: string;
  secondaryText?: string;
  isOnline?: boolean;
}

export default function AvatarWithInfo({ name, url, secondaryText, isOnline }: Props) {
  const initials = useMemo<string>(
    () => name.split(' ', 2).map(text => text[0]).join(''),
    [name]
  )

  return (
    <div className='flex items-center'>
      <div className='relative'>
        <Avatar className='w-[40px] h-[40px] border border-border'>
          <AvatarImage
            className='rounded-full'
            src={url}
            alt={initials}
            width={40}
            height={40}
          />
          <AvatarFallback className='rounded-full'>{initials}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className='absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full bg-green-500 border border-black'></span>
        )}
      </div>
      <div className='ml-2'>
        <label className='text-primary'>{name}</label>
        {secondaryText && (
          <span className='block text-gray-500 text-sm'>{secondaryText}</span>
        )}
      </div>
    </div>
  )
}