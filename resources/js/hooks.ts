import { type ChangeEvent, useCallback, useRef } from 'react'

export function useOnChangeDebounce(callback: CallableFunction, delay: number = 700) {
  const timeoutRef = useRef<number|null>(null)

  const debouncedCallback = useCallback<(event: ChangeEvent<HTMLInputElement>) => void>((event) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(event)
    }, delay)
  }, [callback, delay])

  return debouncedCallback
}