import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PrismLoader } from '@/components/ui/PrismLoader'

const MIN_VISIBLE_MS = 320

function useRouteTransition() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const pathnameRef = useRef(location.pathname)
  const isFirstRef = useRef(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const shownAtRef = useRef(0)

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false
      pathnameRef.current = location.pathname
      return
    }

    if (location.pathname === pathnameRef.current) return

    pathnameRef.current = location.pathname
    shownAtRef.current = Date.now()

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setVisible(true)

    const scheduleHide = () => {
      const elapsed = Date.now() - shownAtRef.current
      const delay = Math.max(0, MIN_VISIBLE_MS - elapsed)
      hideTimerRef.current = setTimeout(() => setVisible(false), delay)
    }

    requestAnimationFrame(() => requestAnimationFrame(scheduleHide))

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [location.pathname])

  return visible
}

export function RouteTransitionOverlay() {
  const visible = useRouteTransition()

  if (!visible) return null

  return (
    <PrismLoader
      layout="route"
      size="md"
      label="Loading page…"
      aria-label="Loading page"
    />
  )
}

/** Root layout — renders route transition overlay above all pages. */
export function RouterRoot() {
  return (
    <>
      <RouteTransitionOverlay />
      <Outlet />
    </>
  )
}
