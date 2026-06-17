import { User } from 'lucide-react'
import type { ImgHTMLAttributes } from 'react'
import { useEffect, useState } from 'react'
import { Skeleton } from './ui/skeleton'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
    size?: number;
}

export function Photo({ alt, size = 36, ...props }: Props) {
    const [status, setStatus] = useState<'loading' | 'broken' | 'loaded'>('loading')

    useEffect(() => {
        if (!props.src) {
            return
        }

        const image = new Image(size, size)

        image.src = props.src

        image.onload = () => {
            setStatus('loaded')
        }

        image.onerror = () => {
            setStatus('broken')
        }

        return () => {
            image.onload = null
            image.onerror = null
        }
    }, [props.src, size])

    if (!props.src || status === 'broken') {
        return <User
            width={size}
            height={size}
            className={props.className}
        />
    }

    if (status === 'loading') {
        return <Skeleton className='size-9' />
    }

    return <img {...props} alt={alt} />
}
