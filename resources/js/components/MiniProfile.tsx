import { useMemo } from 'react'
import { Root, Image, Fallback } from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

interface Props {
  name: string;
  url?: string;
  imageSize?: number;
  secondaryText?: string;
  isOnline?: boolean;
  alignment?: 'horizontal' | 'vertical';
}

export default function MiniProfile({
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
    <div className={cn( alignment === 'horizontal' && 'flex items-center' )}>
      <div className='relative'>
        <Root
          className={cn(
            'relative shrink-0 overflow-hidden rounded-full border border-border',
            alignment === 'vertical' ? 'inline-block' : 'flex'
          )}
          style={{
            width: `${imageSize}px`,
            height: `${imageSize}px`,
          }}
        >
          <Image
            className='h-full w-full aspect-square rounded-full'
            src={url}
            alt={initials}
            width={imageSize}
            height={imageSize}
          />
          <Fallback className='flex h-full w-full items-center justify-center rounded-full bg-muted'>
            {initials}
          </Fallback>
        </Root>
        {isOnline && (
          <span className='absolute bottom-0.5 right-0.5 w-[10px] h-[10px] rounded-full bg-green-500 border border-black'></span>
        )}
      </div>
      <div className={cn(alignment === 'horizontal' && 'ml-2')}>
        <label className='text-primary'>{name}</label>
        {secondaryText && (
          <span className='block text-gray-500 text-sm'>{secondaryText}</span>
        )}
      </div>
    </div>
  )
}