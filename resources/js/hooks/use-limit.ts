import { useRef, useState } from 'react'

export function useDebounce(delay: number = 600) {
    const timeout = useRef<number | null>(null)
    const [canStopDebounce, setCanStopDebounce] = useState<boolean>(false)

    function stopDebounce() {
        if (timeout.current) {
            clearTimeout(timeout.current)
            setCanStopDebounce(false)
        }
    }

    const debounce = (action: CallableFunction) => {
        setCanStopDebounce(true)

        if (timeout.current) {
            clearTimeout(timeout.current)
        }

        timeout.current = setTimeout(() => {
            action()
            setCanStopDebounce(false)
        }, delay)
    }

    return { debounce, stopDebounce, canStopDebounce }
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
