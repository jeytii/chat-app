import type { InertiaLinkProps } from '@inertiajs/react'
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
