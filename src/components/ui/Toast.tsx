import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ToastVariant = 'info' | 'urgent'

export interface ToastInput {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  variant?: ToastVariant
  durationMs?: number
}

interface ToastItem extends ToastInput {
  id: string
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const item: ToastItem = { ...toast, id }
      setToasts((prev) => [...prev, item])

      const duration = toast.durationMs ?? 9000
      if (duration > 0) {
        const timer = window.setTimeout(() => dismissToast(id), duration)
        timersRef.current.set(id, timer)
      }
    },
    [dismissToast],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (typeof document === 'undefined' || toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed top-4 right-4 z-ln-toast flex flex-col gap-3 w-[min(100vw-2rem,400px)] pointer-events-none safe-top"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>,
    document.body,
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const urgent = toast.variant === 'urgent'

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto rounded-[14px] glass-card border border-border p-4 animate-ios-toast ios-shadow-md',
        urgent ? 'ring-1 ring-accent/40' : '',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-[14px] grid place-items-center shrink-0',
            urgent ? 'bg-accent/15 text-accent' : 'bg-secondary/80 text-muted-foreground',
          )}
        >
          <ClipboardList className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground tracking-tight">{toast.title}</p>
          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{toast.message}</p>
          {toast.onAction && toast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                onDismiss()
                toast.onAction?.()
              }}
              className="inline-block mt-3 text-[13px] font-semibold text-accent hover:underline ios-press"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-2 rounded-[12px] hover:bg-secondary/70 text-muted-foreground shrink-0 ios-press transition-colors duration-[180ms]"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}