import { type ChangeEvent, useCallback, useRef } from 'react'

type Listener = (event: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => void;

export function useOnChangeDebounce(callback: Listener, preCallback?: Listener, delay: number = 700) {
  const timeoutRef = useRef<number|null>(null)

  const debouncedCallback = useCallback<Listener>((event) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (preCallback) {
      preCallback(event)
    }

    timeoutRef.current = setTimeout(() => {
      callback(event)
    }, delay)
  }, [callback, delay])

  return debouncedCallback
}