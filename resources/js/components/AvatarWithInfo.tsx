import { useMemo } from 'react'
import clsx from 'clsx'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface Props {
  name: string;
  url?: string;
  imageSize?: number;
  secondaryText?: string;
  isOnline?: boolean;
  alignment?: 'horizontal' | 'vertical';
}

export default function AvatarWithInfo({
  name,
  url,
  secondaryText,
  isOnline,
  imageSize = 40,
  alignment = 'horizontal'
}: Props) {
  const initials = useMemo<string>(
    () => name.split(' ', 2).map(text => text[0]).join(''),
    [name]
  )

  return (
    <div className={clsx(
      alignment === 'horizontal' && 'flex items-center'
    )}>
      <div className='relative'>
        <Avatar
          className={clsx(
            'border border-border',
            alignment === 'vertical' && 'inline-block'
          )}
          style={{
            width: `${imageSize}px`,
            height: `${imageSize}px`,
          }}
        >
          <AvatarImage
            className='rounded-full'
            src={url}
            alt={initials}
            width={imageSize}
            height={imageSize}
          />
          <AvatarFallback className='rounded-full'>{initials}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className='absolute bottom-0.5 right-0.5 w-[10px] h-[10px] rounded-full bg-green-500 border border-black'></span>
        )}
      </div>
      <div className={clsx(alignment === 'horizontal' && 'ml-2')}>
        <label className='text-primary'>{name}</label>
        {secondaryText && (
          <span className='block text-gray-500 text-sm'>{secondaryText}</span>
        )}
      </div>
    </div>
  )
}