import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { btnClass } from '@/components/ui/Button'
import { NotificationListItem } from '@/components/notifications/notificationShared'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationsPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead, clearAll, ensureLoaded } =
    useNotifications()

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const items = notifications
    .filter((n) => n.role === role)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const unread = unreadCount(role)

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="All notifications"
        sub={unread ? `${unread} unread` : 'You’re all caught up.'}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => markAllRead(role)}
              className={`${btnClass.secondary} gap-2 px-4 py-2 text-sm`}
              disabled={!items.some((n) => !n.read)}
            >
              <CheckCircle2 className="w-4 h-4" /> Mark all read
            </button>
            <button
              type="button"
              onClick={() => clearAll(role)}
              className={`${btnClass.secondary} gap-2 px-4 py-2 text-sm`}
              disabled={items.length === 0}
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        }
      />

      {items.length === 0 ? (
        <AppCard className="text-sm text-muted-foreground text-center py-10">
          No notifications yet.
        </AppCard>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <NotificationListItem
              key={n.id}
              n={n}
              onMarkRead={() => markRead(n.id)}
              onOpen={() => {
                void markRead(n.id)
                if (n.href) navigate(n.href)
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-muted-foreground">
        Tip: notifications are role-specific (student / tutor / admin).{' '}
        <Link to={`/${role}`} className="text-accent hover:underline">
          Back to dashboard
        </Link>
      </div>
    </>
  )
}
