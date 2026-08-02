import { useRef } from 'react'

export function useDebounce(delay: number = 600) {
    const timeout = useRef<number | null>(null)

    function stopTimeout() {
        if (timeout.current) {
            clearTimeout(timeout.current)
        }
    }

    const debouncedFn = (action: CallableFunction) => {
        stopTimeout()

        timeout.current = setTimeout(() => {
            action()
        }, delay)
    }

    return { debouncedFn, stopTimeout }
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
