import { useEffect, useRef, type RefObject } from 'react'

/** Scroll an element into view when an error message appears. */
export function scrollErrorIntoView(el: HTMLElement | null | undefined) {
  if (!el) return
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  requestAnimationFrame(() => {
    el.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  })
}

/**
 * Attach the returned ref to an error banner / alert. When `error` is set
 * (or changes), the window scrolls so the message is visible.
 */
export function useScrollToError<T extends HTMLElement = HTMLDivElement>(
  error: string | null | undefined,
): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    if (!error) return
    scrollErrorIntoView(ref.current)
  }, [error])
  return ref
}
