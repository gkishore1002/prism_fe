import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Red asterisk for mandatory fields — use across forms app-wide. */
export function RequiredMark({ className }: { className?: string }) {
  return (
    <span className={cn('required-mark text-rose', className)} aria-hidden="true">
      *
    </span>
  )
}

/**
 * Renders a label string, converting a trailing `*` into a red RequiredMark.
 * Pass `required` to force the mark even without a trailing asterisk.
 */
export function LabelWithRequired({
  label,
  required,
  className,
}: {
  label: ReactNode
  required?: boolean
  className?: string
}) {
  if (typeof label !== 'string') {
    return (
      <span className={className}>
        {label}
        {required ? (
          <>
            {' '}
            <RequiredMark />
          </>
        ) : null}
      </span>
    )
  }

  const trimmed = label.trimEnd()
  const hasStar = /\s*\*$/.test(trimmed)
  const text = hasStar ? trimmed.replace(/\s*\*$/, '') : trimmed
  const show = required || hasStar

  return (
    <span className={className}>
      {text}
      {show ? (
        <>
          {' '}
          <RequiredMark />
        </>
      ) : null}
    </span>
  )
}
