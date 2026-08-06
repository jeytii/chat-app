import { differenceInYears, intervalToDuration, isToday, isYesterday } from 'date-fns'

export function getDateDiff(date: string): string {
    if (isToday(date)) {
        return 'Today'
    }

    if (isYesterday(date)) {
        return 'Yesterday'
    }

    return new Date(date).toLocaleDateString('en-PH', {
        month: 'short',
        day: '2-digit',
        year: differenceInYears(new Date(), date) >= 1
            ? 'numeric'
            : undefined,
    })
}

export function getTimeDiff(date: string): string {
    const diffs = intervalToDuration({
        start: date,
        end: new Date(),
    })

    if (isToday(date) && (diffs.minutes || 0) < 1) {
        return 'Now'
    }

    if (isToday(date) && (diffs.hours || 0) < 1) {
        return `${diffs.minutes}m ago`
    }

    if (isToday(date) && (diffs.hours || 0) >= 1) {
        return `${diffs.hours}h ago`
    }

    return new Date(date).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
    })
}
