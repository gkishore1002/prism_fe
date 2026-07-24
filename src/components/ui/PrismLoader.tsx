import { cn } from '@/lib/cn'

export type PrismLoaderSize = 'xs' | 'sm' | 'md' | 'lg'
export type PrismLoaderLayout = 'inline' | 'block' | 'fullscreen' | 'overlay' | 'card' | 'route'

const sizeMap: Record<PrismLoaderSize, string> = {
  xs: 'ln-loader--xs',
  sm: 'ln-loader--sm',
  md: 'ln-loader--md',
  lg: 'ln-loader--lg',
}

export interface PrismLoaderProps {
  size?: PrismLoaderSize
  layout?: PrismLoaderLayout
  label?: string
  showBrand?: boolean
  className?: string
  'aria-label'?: string
}

export function PrismLoader({
  size = 'md',
  layout = 'block',
  label,
  showBrand = false,
  className,
  'aria-label': ariaLabel,
}: PrismLoaderProps) {
  const statusLabel = ariaLabel ?? label ?? 'Loading'

  const stage = (
    <div className={cn('ln-loader__stage', sizeMap[size])} aria-hidden>
      <div className="ln-loader__ring ln-loader__ring--outer" />
      <div className="ln-loader__orbit ln-loader__orbit--1">
        <span className="ln-loader__node ln-loader__node--navy" />
      </div>
      <div className="ln-loader__orbit ln-loader__orbit--2">
        <span className="ln-loader__node ln-loader__node--gold" />
      </div>
      <div className="ln-loader__orbit ln-loader__orbit--3">
        <span className="ln-loader__node ln-loader__node--leaf" />
      </div>
      <div className="ln-loader__core">
        <span className="ln-loader__plus">+</span>
      </div>
    </div>
  )

  const content = (
    <>
      {showBrand && (
        <p className="ln-loader__brand font-display">
          Prism<span className="text-accent">+</span>
        </p>
      )}
      {stage}
      {label && <p className="ln-loader__label">{label}</p>}
    </>
  )

  if (layout === 'inline') {
    return (
      <span
        className={cn('ln-loader ln-loader--inline', className)}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        {stage}
        {label && <span className="ln-loader__label ln-loader__label--inline">{label}</span>}
      </span>
    )
  }

  if (layout === 'fullscreen') {
    return (
      <div
        className={cn('ln-loader ln-loader--fullscreen app-page-bg', className)}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        <div className="ln-loader__fullscreen-grid" aria-hidden />
        <div className="ln-loader__fullscreen-inner">{content}</div>
      </div>
    )
  }

  if (layout === 'overlay') {
    return (
      <div
        className={cn('ln-loader ln-loader--overlay', className)}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        <div className="ln-loader__overlay-scrim" aria-hidden />
        <div className="ln-loader__overlay-panel">{content}</div>
      </div>
    )
  }

  if (layout === 'card') {
    return (
      <div
        className={cn(
          'ln-loader ln-loader--card rounded-xl border border-border bg-card px-6 py-16 text-center',
          className,
        )}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        {content}
      </div>
    )
  }

  if (layout === 'route') {
    return (
      <div
        className={cn('ln-loader ln-loader--route', className)}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        <div className="ln-loader__route-scrim" aria-hidden />
        <div className="ln-loader__route-panel">{content}</div>
      </div>
    )
  }

  return (
    <div
      className={cn('ln-loader ln-loader--block', className)}
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      {content}
    </div>
  )
}

/** Standard page-level loading state */
export function PageLoader({
  label = 'Loading…',
  className,
  minHeight = true,
}: {
  label?: string
  className?: string
  minHeight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center p-8',
        minHeight && 'min-h-[200px]',
        className,
      )}
    >
      <PrismLoader size="md" layout="block" label={label} />
    </div>
  )
}

/** Compact inline loading indicator (search, buttons, table rows) */
export function InlineLoader({
  label,
  size = 'xs',
  className,
  ...props
}: Pick<PrismLoaderProps, 'label' | 'size' | 'className' | 'aria-label'>) {
  return (
    <PrismLoader
      size={size}
      layout="inline"
      label={label}
      className={className}
      {...props}
    />
  )
}