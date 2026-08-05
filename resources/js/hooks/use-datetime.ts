import { differenceInYears, intervalToDuration, isToday, isYesterday } from 'date-fns'

export function getDateDiff(date: string): string {
    // const value = typeof date === 'string'
    //     ? new Date(date)
    //     : date

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
    // const value = typeof date === 'string'
    //     ? new Date(date)
    //     : date

    const diffs = intervalToDuration({
        start: date,
        end: new Date(),
    })

    if ((diffs.minutes || 0) < 1) {
        return 'Now'
    }

    if ((diffs.hours || 0) < 1) {
        return `${diffs.minutes}m ago`
    }

    const time = new Date(date).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
    })

    if ((diffs.hours || 0) >= 1 && isToday(date)) {
        return `${diffs.hours}h ago (${time})`
    }

    return time
}
