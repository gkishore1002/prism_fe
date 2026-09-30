import { cn } from '@/lib/cn'
import { useScrollToError } from '@/hooks/useScrollToError'

interface FormErrorBannerProps {
  message: string | null | undefined
  className?: string
  /** Compact inline style for dense forms */
  size?: 'sm' | 'md'
}

/**
 * Section/form error alert that scrolls into view whenever the message appears
 * or changes — so users who submitted from the bottom of a long form see it.
 */
export function FormErrorBanner({ message, className, size = 'md' }: FormErrorBannerProps) {
  const ref = useScrollToError(message)
  if (!message) return null

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={cn(
        'rounded-md border border-rose/30 bg-rose/5 text-rose outline-none',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        className,
      )}
    >
      {message}
    </div>
  )
}
