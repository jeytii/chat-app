import type { InertiaLinkProps } from '@inertiajs/react'
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import Echo from 'laravel-echo'
import { twMerge } from 'tailwind-merge'

export const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
})

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url
}

export function toReadableDate(
    date: string | Date,
    month: Intl.DateTimeFormatOptions['month'] = 'long',
    day: Intl.DateTimeFormatOptions['day'] = '2-digit',
    year: Intl.DateTimeFormatOptions['year'] = 'numeric',
) {
    const value = typeof date === 'string'
        ? new Date(date)
        : date

    return value.toLocaleDateString('en-PH', { month, day, year })
}
