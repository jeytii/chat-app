import { useMemo } from 'react'
import { Root, Image, Fallback } from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

interface Props {
  name?: string;
  url?: string;
  imageSize?: number;
  secondaryText?: string;
  isOnline?: boolean;
  alignment?: 'horizontal' | 'vertical';
}

export default function Avatar({
  name,
  url,
  secondaryText,
  isOnline,
  imageSize = 40,
  alignment = 'horizontal'
}: Props) {
  const initials = useMemo<string>(
    () => name ? name.split(' ', 2).map(text => text[0]).join('') : '',
    [name]
  )

  return (
    <div className={cn( alignment === 'horizontal' && 'flex items-center' )}>
      <div className='relative'>
        <Root
          className={cn(
            'relative shrink-0 overflow-hidden rounded-full border border-primary p-1',
            alignment === 'vertical' ? 'mx-auto block' : 'flex'
          )}
          style={{
            width: `${imageSize}px`,
            height: `${imageSize}px`,
          }}
        >
          <Image
            className='aspect-square size-full rounded-full'
            src={url}
            alt={initials}
            width={imageSize}
            height={imageSize}
          />
          <Fallback className='flex size-full items-center justify-center rounded-full bg-muted'>
            {initials}
          </Fallback>
        </Root>
        {isOnline && (
          <span className='absolute bottom-0.5 right-0.5 size-[10px] rounded-full border border-black bg-green-500'></span>
        )}
      </div>

      {(!!name || !!secondaryText) && (
        <div className={cn(alignment === 'horizontal' && 'ml-2')}>
          <label className='text-primary'>{name}</label>
          {secondaryText && (
            <span className='block text-sm text-gray-500'>{secondaryText}</span>
          )}
        </div>
      )}
    </div>
  )
}