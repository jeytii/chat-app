import { type ImgHTMLAttributes, useEffect, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
    size?: number;
    skeletonClassName?: string;
}

const protocol = import.meta.env.PROD ? 'https://' : 'http://'

export default function Photo({ size, className, skeletonClassName, ...props }: Props) {
    const [status, setStatus] = useState<'loading' | 'broken' | 'loaded'>(
        props.src?.startsWith(protocol) ? 'loading' : 'loaded',
    )

    useEffect(() => {
        if (props.src?.startsWith(protocol)) {
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
        }
    }, [props.src, size])

    if (!props.src || status === 'broken') {
        return (
            <div className={cn('size-10 rounded-full', className)}>
                <svg
                    viewBox='0 0 512 512'
                    role='image'
                    aria-label='Default photo'
                    className={cn('size-10 rounded-full fill-secondary', className)}
                >
                    <path d='M399 384.2C376.9 345.8 335.4 320 288 320l-64 0c-47.4 0-88.9 25.8-111 64.2 35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z' />
                </svg>
            </div>
        )
    }

    if (status === 'loading') {
        return <Skeleton className={cn('size-10 rounded-full', skeletonClassName)} {...props} />
    }

    return <img className={cn('size-10 rounded-full', className)} {...props} />
}
