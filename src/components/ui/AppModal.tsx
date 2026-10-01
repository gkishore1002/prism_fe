import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, FilePenLine, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface AppModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  footerClassName?: string
  size?: ModalSize
  className?: string
  panelClassName?: string
  bodyClassName?: string
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  hideCloseButton?: boolean
  ariaLabel?: string
  align?: 'start' | 'center'
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  full: 'max-w-5xl',
}

export function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  footerClassName,
  size = 'md',
  className,
  panelClassName,
  bodyClassName,
  closeOnOverlay = true,
  closeOnEscape = true,
  hideCloseButton = false,
  ariaLabel,
  align = 'start',
}: AppModalProps) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || !closeOnEscape) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closeOnEscape, onClose])

  if (!open) return null

  const hasHeader = Boolean(title || description || !hideCloseButton)

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-ln-modal-backdrop glass-overlay"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-label="Close modal"
        tabIndex={closeOnOverlay ? 0 : -1}
      />
      <div
        className={cn(
          'fixed inset-0 z-ln-modal flex p-0 sm:p-6 overflow-y-auto pointer-events-none safe-top safe-bottom',
          align === 'center' ? 'items-end sm:items-center justify-center' : 'items-end sm:items-start justify-center',
          className,
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
          className={cn(
            'pointer-events-auto relative w-full glass-sheet border border-border flex flex-col animate-ios-sheet',
            'rounded-t-[20px] sm:rounded-[14px] max-h-[min(92dvh,calc(100vh-1rem))] sm:max-h-[calc(100vh-3rem)]',
            sizeClasses[size],
            panelClassName,
          )}
        >
          {hasHeader && (
            <div className="flex items-start justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border shrink-0">
              <div className="min-w-0">
                {title && (
                  <h2 className="font-display text-lg sm:text-xl text-foreground">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-secondary/80 rounded-[12px] shrink-0 ios-press transition-colors duration-[180ms]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {children !== undefined && (
            <div className={cn('flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin', bodyClassName)}>
              {children}
            </div>
          )}

          {footer && (
            <div
              className={cn(
                'flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-3 sm:py-4 border-t border-border shrink-0 bg-card/30 backdrop-blur-md safe-bottom',
                footerClassName ?? 'sm:justify-end',
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

export type UnsavedWorkChoice = 'draft' | 'publish' | 'cancel'

export interface UnsavedWorkOptions {
  title?: string
  message?: string
  draftLabel?: string
  publishLabel?: string
  cancelLabel?: string
}

interface ConfirmState extends ConfirmOptions {
  kind: 'binary'
  resolve: (value: boolean) => void
}

interface UnsavedWorkState extends UnsavedWorkOptions {
  kind: 'unsaved'
  resolve: (value: UnsavedWorkChoice | null) => void
}

type ModalState = ConfirmState | UnsavedWorkState

interface ConfirmModalContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  confirmUnsavedWork: (options?: UnsavedWorkOptions) => Promise<UnsavedWorkChoice | null>
}

const ConfirmModalContext = createContext<ConfirmModalContextValue | null>(null)

/** Centered confirm shell — Swotify-style (icon + title + message + stacked/row actions). */
function ConfirmDialogShell({
  title,
  message,
  tone = 'default',
  children,
  onDismiss,
}: {
  title: string
  message?: string
  tone?: 'default' | 'danger' | 'draft'
  children: ReactNode
  onDismiss: () => void
}) {
  const Icon = tone === 'danger' ? Trash2 : tone === 'draft' ? FilePenLine : AlertTriangle
  const iconWrap =
    tone === 'danger'
      ? 'bg-rose/10 text-rose'
      : tone === 'draft'
        ? 'bg-accent/15 text-accent-foreground'
        : 'bg-amber-50 text-amber-800'

  return createPortal(
    <div
      className="fixed inset-0 z-ln-modal flex items-center justify-center p-4 safe-top safe-bottom"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prism-confirm-title"
        className="relative z-[1] w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.22)] animate-ios-sheet sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full', iconWrap)}>
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <h3 id="prism-confirm-title" className="font-display text-lg font-semibold text-foreground">
          {title}
        </h3>
        {message ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function confirmBtnClass(kind: 'primary' | 'secondary' | 'danger' | 'ghost') {
  if (kind === 'danger') {
    return 'w-full rounded-xl bg-rose px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90'
  }
  if (kind === 'primary') {
    return 'w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover'
  }
  if (kind === 'secondary') {
    return 'w-full rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent/20'
  }
  return 'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground'
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, kind: 'binary', resolve })
    })
  }, [])

  const confirmUnsavedWork = useCallback((options: UnsavedWorkOptions = {}) => {
    return new Promise<UnsavedWorkChoice | null>((resolve) => {
      setState({ ...options, kind: 'unsaved', resolve })
    })
  }, [])

  function closeBinary(result: boolean) {
    if (state?.kind !== 'binary') return
    state.resolve(result)
    setState(null)
  }

  function closeUnsaved(result: UnsavedWorkChoice | null) {
    if (state?.kind !== 'unsaved') return
    state.resolve(result)
    setState(null)
  }

  useEffect(() => {
    if (!state) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setState((prev) => {
        if (!prev) return null
        if (prev.kind === 'unsaved') prev.resolve(null)
        else prev.resolve(false)
        return null
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [state])

  const isDanger = state?.kind === 'binary' && state.variant === 'danger'
  const isUnsaved = state?.kind === 'unsaved'

  return (
    <ConfirmModalContext.Provider value={{ confirm, confirmUnsavedWork }}>
      {children}
      {state ? (
        isUnsaved ? (
          <ConfirmDialogShell
            title={state.title ?? 'Save before leaving?'}
            message={
              state.message ??
              'You have unsaved changes. Publish, save as draft, or discard to leave this page.'
            }
            tone="draft"
            onDismiss={() => closeUnsaved(null)}
          >
            <button
              type="button"
              autoFocus
              onClick={() => closeUnsaved('publish')}
              className={confirmBtnClass('primary')}
            >
              {state.publishLabel ?? 'Publish'}
            </button>
            <button
              type="button"
              onClick={() => closeUnsaved('draft')}
              className={confirmBtnClass('secondary')}
            >
              {state.draftLabel ?? 'Save as draft'}
            </button>
            <button
              type="button"
              onClick={() => closeUnsaved('cancel')}
              className={confirmBtnClass('danger')}
            >
              {state.cancelLabel ?? 'Discard & leave'}
            </button>
            <button
              type="button"
              onClick={() => closeUnsaved(null)}
              className={confirmBtnClass('ghost')}
            >
              Stay on this page
            </button>
          </ConfirmDialogShell>
        ) : (
          <ConfirmDialogShell
            title={state.title ?? 'Confirm'}
            message={state.message}
            tone={isDanger ? 'danger' : 'default'}
            onDismiss={() => closeBinary(false)}
          >
            <button
              type="button"
              autoFocus
              onClick={() => closeBinary(true)}
              className={confirmBtnClass(isDanger ? 'danger' : 'primary')}
            >
              {state.confirmLabel ?? 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => closeBinary(false)}
              className={confirmBtnClass('ghost')}
            >
              {state.cancelLabel ?? 'Cancel'}
            </button>
          </ConfirmDialogShell>
        )
      ) : null}
    </ConfirmModalContext.Provider>
  )
}

export function useConfirmModal() {
  const ctx = useContext(ConfirmModalContext)
  if (!ctx) {
    throw new Error('useConfirmModal must be used within ConfirmModalProvider')
  }
  return ctx
}
