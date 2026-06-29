import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { btnClass } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/cn'
import type { AppNotification, NotificationKind } from '@/types'

const kindTone: Record<NotificationKind, { dot: string; badge: string }> = {
  info: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
  success: { dot: 'bg-leaf', badge: 'bg-leaf/10 text-leaf border-leaf/20' },
  warning: { dot: 'bg-accent', badge: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  risk: { dot: 'bg-rose', badge: 'bg-rose/10 text-rose border-rose/20' },
  ai: { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / (1000 * 60))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function NotificationRow({
  n,
  onOpen,
  onMarkRead,
}: {
  n: AppNotification
  onOpen: () => void
  onMarkRead: () => void
}) {
  const tone = kindTone[n.kind]
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'w-full text-left rounded-lg border border-border bg-card p-4 transition',
        'hover:bg-secondary/50',
        !n.read && 'ring-1 ring-accent/20',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('mt-1.5 w-2.5 h-2.5 rounded-full shrink-0', tone.dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn('font-semibold truncate', n.read ? 'text-foreground' : 'text-ink')}>
                {n.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-muted-foreground font-mono-data">{timeAgo(n.createdAt)}</span>
              <div className="mt-2 flex items-center justify-end gap-2">
                {!n.read && (
                  <span className={cn('text-[10px] px-2 py-0.5 rounded border font-semibold', tone.badge)}>
                    New
                  </span>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkRead()
                    }}
                    className="text-[11px] text-muted-foreground hover:text-ink underline underline-offset-2"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications()

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
            <NotificationRow
              key={n.id}
              n={n}
              onMarkRead={() => markRead(n.id)}
              onOpen={() => {
                markRead(n.id)
                if (n.href) navigate(n.href)
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-muted-foreground">
        Tip: notifications are role-specific (student / tutor / admin).
        {' '}
        <Link to={`/${role}`} className="text-accent hover:underline">
          Back to dashboard
        </Link>
      </div>
    </>
  )
}

