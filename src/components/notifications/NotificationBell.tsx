import { Bell } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import type { ModuleId } from '@/lib/modules'
import { cn } from '@/lib/cn'
import {
  NotificationPreviewPopover,
  useNotificationPopoverDismiss,
} from '@/components/notifications/NotificationPreviewPopover'

const PANEL_WIDTH_PX = 320
const PANEL_GAP_PX = 8

interface NotificationBellProps {
  moduleId: ModuleId
}

/** Minimal notification peek — same popover UX for admin, tutor, and student portals. */
export function NotificationBell({ moduleId }: NotificationBellProps) {
  const homePath = `/${moduleId}`
  const { pathname } = useLocation()
  const { unreadCount, ensureLoaded, notifications, loading, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  const unread = unreadCount(moduleId)
  const recentNotifications = useMemo(
    () =>
      notifications
        .filter((n) => n.role === moduleId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3),
    [notifications, moduleId],
  )

  const updatePanelPosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const width = Math.min(PANEL_WIDTH_PX, window.innerWidth - 16)
    const right = Math.max(8, window.innerWidth - rect.right)
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + PANEL_GAP_PX,
      right,
      width,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePanelPosition()
    const onScrollOrResize = () => updatePanelPosition()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updatePanelPosition])

  useEffect(() => {
    setOpen(false)
  }, [pathname, moduleId])

  useNotificationPopoverDismiss(open, () => setOpen(false), anchorRef, panelRef)

  async function toggleOpen() {
    if (open) {
      setOpen(false)
      return
    }
    await ensureLoaded()
    setOpen(true)
  }

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => void toggleOpen()}
        className={cn(
          'relative btn btn-ghost p-2 text-muted-foreground',
          open && 'bg-secondary text-foreground',
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose text-white text-[10px] font-bold grid place-items-center ios-shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <NotificationPreviewPopover
            panelRef={panelRef}
            style={panelStyle}
            open
            onClose={() => setOpen(false)}
            notifications={recentNotifications}
            loading={loading}
            viewAllPath={`${homePath}/notifications`}
            onMarkRead={markRead}
          />,
          document.body,
        )}
    </div>
  )
}
