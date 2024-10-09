import { useCallback, useRef } from 'react'

type RefCallback = (node: HTMLElement|null) => void

export default function useInfiniteScroll(loading: boolean, callback: CallableFunction): RefCallback {
  const observer = useRef<IntersectionObserver|null>(null)

  const ref = useCallback<RefCallback>((node) => {
    if (loading) {
      return
    }

    if (observer.current) {
      observer.current.disconnect()
    }

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback()
      }
    })

    if (node) {
      observer.current.observe(node)
    }
  }, [loading])

  return ref
}
