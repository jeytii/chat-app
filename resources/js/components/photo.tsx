import type { ImgHTMLAttributes, SVGAttributes } from 'react'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

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

    if (status === 'broken') {
        return <DefaultPhoto
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

export function DefaultPhoto(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox='0 0 512 512'
            fill='currentColor'
            role='image'
            aria-label='Default photo'
            {...props}
        >
            <path d='M399 384.2C376.9 345.8 335.4 320 288 320l-64 0c-47.4 0-88.9 25.8-111 64.2 35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z' />
        </svg>
    )
}
