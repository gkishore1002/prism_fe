import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
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

  const isDanger = state?.kind === 'binary' && state.variant === 'danger'
  const isUnsaved = state?.kind === 'unsaved'

  return (
    <ConfirmModalContext.Provider value={{ confirm, confirmUnsavedWork }}>
      {children}
      <AppModal
        open={Boolean(state)}
        onClose={() => (isUnsaved ? closeUnsaved(null) : closeBinary(false))}
        title={
          state?.kind === 'unsaved'
            ? (state.title ?? 'Unsaved work')
            : (state?.title ?? 'Confirm')
        }
        size="sm"
        closeOnOverlay={false}
        footerClassName={
          isUnsaved
            ? 'justify-stretch flex-col-reverse sm:flex-row sm:justify-end gap-2'
            : 'justify-stretch flex-col-reverse sm:flex-row sm:justify-end gap-2'
        }
        footer={
          isUnsaved ? (
            <>
              <button
                type="button"
                onClick={() => closeUnsaved('cancel')}
                className="text-sm px-4 py-2.5 rounded-[12px] border border-border glass ios-press hover:bg-secondary/60 transition-all duration-[280ms] w-full sm:w-auto"
              >
                {state.cancelLabel ?? 'Discard'}
              </button>
              <button
                type="button"
                onClick={() => closeUnsaved('draft')}
                className="text-sm px-4 py-2.5 rounded-[12px] border border-accent/40 bg-accent/10 text-foreground font-medium ios-press hover:bg-accent/20 transition-all duration-[280ms] w-full sm:w-auto"
              >
                {state.draftLabel ?? 'Save draft'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeUnsaved('publish')}
                className="text-sm px-4 py-2.5 rounded-[12px] font-medium bg-accent text-accent-foreground hover:opacity-90 ios-shadow-sm ios-press transition-all duration-[280ms] w-full sm:w-auto"
              >
                {state.publishLabel ?? 'Publish'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => closeBinary(false)}
                className="text-sm px-4 py-2.5 rounded-[12px] border border-border glass ios-press hover:bg-secondary/60 transition-all duration-[280ms] w-full sm:w-auto"
              >
                {state?.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeBinary(true)}
                className={cn(
                  'text-sm px-4 py-2.5 rounded-[12px] font-medium ios-press transition-all duration-[280ms] w-full sm:w-auto',
                  isDanger
                    ? 'bg-rose text-white hover:opacity-90 ios-shadow-sm'
                    : 'bg-accent text-accent-foreground hover:opacity-90 ios-shadow-sm',
                )}
              >
                {state?.confirmLabel ?? 'Confirm'}
              </button>
            </>
          )
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          {state?.kind === 'unsaved'
            ? (state.message ??
              'You have unsaved changes. Save as draft to continue later, publish now, or discard and leave.')
            : state?.message}
        </p>
      </AppModal>
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