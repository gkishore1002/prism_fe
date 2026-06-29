import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AppNotification, UserRole } from '@/types'
import { notifications as seedNotifications } from '@/data/mock'

interface NotificationsContextValue {
  notifications: AppNotification[]
  unreadCount: (role: UserRole) => number
  markRead: (id: string) => void
  markAllRead: (role: UserRole) => void
  clearAll: (role: UserRole) => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>(seedNotifications)

  const unreadCount = (role: UserRole) => items.filter((n) => n.role === role && !n.read).length

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = (role: UserRole) => {
    setItems((prev) => prev.map((n) => (n.role === role ? { ...n, read: true } : n)))
  }

  const clearAll = (role: UserRole) => {
    setItems((prev) => prev.filter((n) => n.role !== role))
  }

  const value = useMemo(
    () => ({
      notifications: items,
      unreadCount,
      markRead,
      markAllRead,
      clearAll,
    }),
    [items],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}

