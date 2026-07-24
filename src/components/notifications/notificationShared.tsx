import { cn } from '@/lib/cn'
import type { AppNotification, NotificationKind } from '@/types'

export const kindTone: Record<NotificationKind, { dot: string; badge: string }> = {
  info: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
  success: { dot: 'bg-leaf', badge: 'bg-leaf/10 text-leaf border-leaf/20' },
  warning: { dot: 'bg-accent', badge: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  risk: { dot: 'bg-rose', badge: 'bg-rose/10 text-rose border-rose/20' },
  ai: { dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
}

export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / (1000 * 60))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

interface NotificationListItemProps {
  n: AppNotification
  onOpen: () => void
  onMarkRead?: () => void
  compact?: boolean
}

export function NotificationListItem({
  n,
  onOpen,
  onMarkRead,
  compact = false,
}: NotificationListItemProps) {
  const tone = kindTone[n.kind]
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'w-full text-left rounded-lg border border-border bg-card transition hover:bg-secondary/50',
        compact ? 'p-3' : 'p-4',
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
              <p
                className={cn(
                  'text-muted-foreground mt-1',
                  compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2',
                )}
              >
                {n.message}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-muted-foreground font-mono-data">{timeAgo(n.createdAt)}</span>
              {!n.read && (
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded border font-semibold', tone.badge)}>
                    New
                  </span>
                  {onMarkRead && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
