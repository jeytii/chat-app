import { useRef } from 'react'

export function useDebounce(delay: number = 600) {
    const timeout = useRef<number | null>(null)

    const debouncedFn = (action: CallableFunction) => {
        if (timeout.current) {
            clearTimeout(timeout.current)
        }

        timeout.current = setTimeout(() => {
            action()
        }, delay)
    }

    return debouncedFn
}

export function useThrottle(delay: number = 600) {
    const throttle = useRef<boolean>(false)

    return (action: CallableFunction) => {
        if (throttle.current) {
            return
        }

        action()

        throttle.current = true

        setTimeout(() => {
            throttle.current = false
        }, delay)
    }
}
