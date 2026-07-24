import { useEffect, type CSSProperties, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { kindTone, timeAgo } from '@/components/notifications/notificationShared'
import { cn } from '@/lib/cn'
import type { AppNotification } from '@/types'

interface NotificationPreviewPopoverProps {
  open: boolean
  onClose: () => void
  notifications: AppNotification[]
  loading: boolean
  viewAllPath: string
  onMarkRead: (id: string) => void
  panelRef?: RefObject<HTMLDivElement | null>
  style?: CSSProperties
}

function NotificationPeekItem({
  n,
  onOpen,
}: {
  n: AppNotification
  onOpen: () => void
}) {
  const tone = kindTone[n.kind]
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'w-full text-left px-3 py-2.5 transition-colors hover:bg-secondary/60 border-b border-border/70 last:border-b-0',
        !n.read && 'bg-accent/5',
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', tone.dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-medium truncate', !n.read && 'text-ink')}>{n.title}</p>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0">
              {timeAgo(n.createdAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        </div>
      </div>
    </button>
  )
}

export function NotificationPreviewPopover({
  open,
  onClose,
  notifications,
  loading,
  viewAllPath,
  onMarkRead,
  panelRef,
  style,
}: NotificationPreviewPopoverProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleOpen(notification: AppNotification) {
    void onMarkRead(notification.id)
    onClose()
    if (notification.href) navigate(notification.href)
  }

  function handleViewAll() {
    onClose()
    navigate(viewAllPath)
  }

  return (
    <div
      ref={panelRef}
      style={style}
      className={cn(
        'rounded-xl border border-border bg-card shadow-[0_8px_30px_rgba(22,58,102,0.12)] z-ln-dropdown overflow-hidden',
        style ? 'fixed' : 'absolute right-0 top-[calc(100%+0.5rem)] w-[min(92vw,20rem)]',
      )}
      role="dialog"
      aria-label="Recent notifications"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Notifications
        </p>
        {notifications.some((n) => !n.read) && (
          <span className="text-[10px] text-accent font-medium">New</span>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <p className="text-xs text-muted-foreground px-3 py-6 text-center">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="text-xs text-muted-foreground px-3 py-6 text-center">No notifications yet.</p>
      ) : (
        <div className="max-h-[min(50vh,16rem)] overflow-y-auto scrollbar-thin">
          {notifications.map((n) => (
            <NotificationPeekItem key={n.id} n={n} onOpen={() => handleOpen(n)} />
          ))}
        </div>
      )}

      <div className="border-t border-border px-3 py-2 bg-card">
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full text-xs font-medium text-accent hover:text-accent/80 py-1.5 text-center"
        >
          View all
        </button>
      </div>
    </div>
  )
}

export function useNotificationPopoverDismiss(
  open: boolean,
  onClose: () => void,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef?.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, onClose, anchorRef, panelRef])
}
