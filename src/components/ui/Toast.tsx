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
import { X, ClipboardList, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ToastVariant = 'info' | 'urgent'
export type ToastPlacement = 'corner' | 'center'

export interface ToastInput {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  variant?: ToastVariant
  placement?: ToastPlacement
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

      const duration = toast.durationMs ?? (toast.placement === 'center' ? 0 : 9000)
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
  const cornerToasts = toasts.filter((t) => t.placement !== 'center')
  const centerToasts = toasts.filter((t) => t.placement === 'center')
  const hasCenterToast = centerToasts.length > 0

  useEffect(() => {
    if (!hasCenterToast || typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [hasCenterToast])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {cornerToasts.length > 0 && (
        <div
          className="fixed top-4 right-4 z-ln-toast flex flex-col gap-3 w-[min(100vw-2rem,400px)] pointer-events-none safe-top"
          aria-live="polite"
        >
          {cornerToasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
          ))}
        </div>
      )}
      {centerToasts.map((toast) => (
        <CenterToastOverlay key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </>,
    document.body,
  )
}

function CenterToastOverlay({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: () => void
}) {
  const urgent = toast.variant === 'urgent'
  const Icon = urgent ? AlertCircle : ClipboardList

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <div
      className="fixed inset-0 z-ln-toast flex items-center justify-center p-4 sm:p-6 md:p-8 safe-top safe-bottom"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Dismiss dialog"
        className="absolute inset-0 bg-[rgba(19,27,46,0.48)] backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md"
        onClick={onDismiss}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`toast-title-${toast.id}`}
        aria-describedby={`toast-message-${toast.id}`}
        className={cn(
          'relative w-full max-w-[min(100%,26rem)] sm:max-w-md',
          'max-h-[min(90dvh,32rem)] overflow-y-auto',
          'rounded-2xl border border-border bg-card shadow-card-raised',
          'p-5 sm:p-6 animate-ios-toast pointer-events-auto',
          urgent ? 'ring-1 ring-rose/25' : '',
        )}
      >
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div
            className={cn(
              'w-12 h-12 rounded-2xl grid place-items-center shrink-0 mb-4',
              urgent ? 'bg-rose/10 text-rose' : 'bg-secondary/80 text-muted-foreground',
            )}
          >
            <Icon className="w-6 h-6" strokeWidth={2} />
          </div>

          <div className="w-full min-w-0 flex-1">
            <p
              id={`toast-title-${toast.id}`}
              className="text-base sm:text-lg font-semibold text-foreground tracking-tight text-balance"
            >
              {toast.title}
            </p>
            <p
              id={`toast-message-${toast.id}`}
              className="text-sm sm:text-[15px] text-muted-foreground mt-2 leading-relaxed text-pretty break-words"
            >
              {toast.message}
            </p>
          </div>

          <div className="mt-5 w-full flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                'w-full sm:w-auto min-h-[44px] px-5 rounded-xl text-sm font-semibold transition-colors ios-press',
                urgent
                  ? 'bg-accent text-accent-foreground hover:opacity-90'
                  : 'bg-secondary text-foreground hover:bg-secondary/80',
              )}
            >
              {toast.actionLabel ?? 'OK'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 p-2 rounded-xl hover:bg-secondary/70 text-muted-foreground ios-press transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
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
