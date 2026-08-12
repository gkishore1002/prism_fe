import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppNotification, UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import * as notificationsApi from '@/lib/api/notificationsApi'

const POLL_INTERVAL_MS = 60_000

interface NotificationsContextValue {
  notifications: AppNotification[]
  loading: boolean
  error: string | null
  unreadCount: (role: UserRole) => number
  markRead: (id: string) => Promise<void>
  markAllRead: (role: UserRole) => Promise<void>
  clearAll: (role: UserRole) => Promise<void>
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadPromiseRef = useRef<Promise<void> | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !role) return
    setLoading(true)
    setError(null)
    try {
      const data = await notificationsApi.fetchNotifications(role)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role])

  const ensureLoaded = useCallback(async () => {
    if (!isAuthenticated || !role) return
    if (items.length > 0) return
    if (!loadPromiseRef.current) {
      loadPromiseRef.current = refresh().finally(() => {
        loadPromiseRef.current = null
      })
    }
    await loadPromiseRef.current
  }, [isAuthenticated, role, items.length, refresh])

  useEffect(() => {
    if (!isAuthenticated || !role) {
      setItems([])
      return
    }
    void refresh()
  }, [isAuthenticated, role, refresh])

  useEffect(() => {
    if (!isAuthenticated || !role) return
    const timer = window.setInterval(() => {
      void refresh()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isAuthenticated, role, refresh])

  useEffect(() => {
    if (!isAuthenticated || !role) return
    const onFocus = () => {
      void refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isAuthenticated, role, refresh])

  const unreadCount = (r: UserRole) => items.filter((n) => n.role === r && !n.read).length

  const markRead = useCallback(async (id: string) => {
    const updated = await notificationsApi.markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? updated : n)))
  }, [])

  const markAllRead = useCallback(async (r: UserRole) => {
    await notificationsApi.markAllNotificationsRead(r)
    setItems((prev) => prev.map((n) => (n.role === r ? { ...n, read: true } : n)))
  }, [])

  const clearAll = useCallback(async (r: UserRole) => {
    await notificationsApi.clearNotifications(r)
    setItems((prev) => prev.filter((n) => n.role !== r))
  }, [])

  const value = useMemo(
    () => ({
      notifications: items,
      loading,
      error,
      unreadCount,
      markRead,
      markAllRead,
      clearAll,
      refresh,
      ensureLoaded,
    }),
    [items, loading, error, markRead, markAllRead, clearAll, refresh, ensureLoaded],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
