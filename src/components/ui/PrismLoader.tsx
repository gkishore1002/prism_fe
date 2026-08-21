import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import { APP_NAME } from '@/lib/constants'
import '@/modules/tutor/styles/learningGenome.css'

export type PrismLoaderSize = 'xs' | 'sm' | 'md' | 'lg'
export type PrismLoaderLayout =
  | 'inline'
  | 'block'
  | 'fullscreen'
  | 'overlay'
  | 'card'
  | 'route'
  | 'report'

const stagePx: Record<PrismLoaderSize, number> = {
  xs: 28,
  sm: 40,
  md: 72,
  lg: 96,
}

const nodePx: Record<PrismLoaderSize, number> = {
  xs: 5,
  sm: 6,
  md: 8,
  lg: 10,
}

export interface PrismLoaderProps {
  size?: PrismLoaderSize
  layout?: PrismLoaderLayout
  label?: string
  showBrand?: boolean
  className?: string
  'aria-label'?: string
  steps?: string[]
}

function LoaderMark({
  size,
  variant = 'spectrum',
}: {
  size: PrismLoaderSize
  variant?: 'spectrum' | 'heritage'
}) {
  const dim = stagePx[size]
  const node = nodePx[size]
  const orbit = dim * 0.38
  const heritage = variant === 'heritage'
  const nodes = heritage
    ? ([
        { color: '#F0D78A', phase: 0 },
        { color: '#C9A24B', phase: 120 },
        { color: '#E4C077', phase: 240 },
      ] as const)
    : ([
        { color: '#1C2739', phase: 0 },
        { color: '#F7B731', phase: 120 },
        { color: '#8B5CF6', phase: 240 },
      ] as const)

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-[12%] rounded-full"
        style={{
          background: heritage
            ? 'radial-gradient(circle, rgba(201,162,75,0.22) 0%, rgba(240,215,138,0.1) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,101,243,0.18) 0%, rgba(255,149,10,0.08) 45%, transparent 70%)',
        }}
        animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute inset-0 rounded-full border border-dashed"
        style={{
          borderColor: heritage ? 'rgba(240,215,138,0.4)' : 'rgba(0,101,243,0.35)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute inset-[14%] rounded-full border-2"
        style={{
          borderColor: heritage ? 'rgba(201,162,75,0.55)' : 'rgba(255,149,10,0.45)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {nodes.map((n) => (
        <motion.span
          key={n.color}
          className="absolute left-1/2 top-1/2"
          style={{ width: 0, height: 0, rotate: n.phase }}
          animate={{ rotate: n.phase + 360 }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <span
            className="absolute rounded-full"
            style={{
              width: node,
              height: node,
              left: -node / 2,
              top: -orbit - node / 2,
              background: n.color,
              boxShadow: `0 0 10px ${n.color}66`,
            }}
          />
        </motion.span>
      ))}

      <motion.div
        className="relative z-[1] grid place-items-center rounded-[4px] font-display font-bold leading-none"
        style={{
          width: dim * 0.34,
          height: dim * 0.34,
          fontSize: dim * 0.2,
          background: heritage ? '#0B1F3A' : '#131B2E',
          color: heritage ? '#F0D78A' : '#fff',
          border: heritage ? '1px solid rgba(201,162,75,0.55)' : undefined,
          boxShadow: heritage
            ? '0 8px 20px rgba(11,31,58,0.35)'
            : '0 8px 20px rgba(19,27,46,0.25)',
          rotate: 45,
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span style={{ transform: 'rotate(-45deg)' }}>+</span>
      </motion.div>
    </div>
  )
}

function CyclingSteps({
  steps,
  tone,
}: {
  steps: string[]
  tone: 'default' | 'report'
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (steps.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % steps.length)
    }, 1800)
    return () => window.clearInterval(id)
  }, [steps])

  return (
    <div className="relative h-4 w-full max-w-xs overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={steps[index]}
          className={cn(
            'absolute inset-x-0 text-center text-[11px] font-mono uppercase tracking-[0.12em]',
            tone === 'report' ? 'text-[#D8D0BC]' : 'text-muted-foreground',
          )}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
        >
          {steps[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

function LoaderCopy({
  label,
  showBrand,
  steps,
  tone = 'default',
}: {
  label?: string
  showBrand?: boolean
  steps?: string[]
  tone?: 'default' | 'report'
}) {
  const cycle =
    steps && steps.length > 0
      ? steps
      : label
        ? [label]
        : ['Gathering signals…']

  return (
    <div className="mt-5 flex w-full flex-col items-center gap-2 text-center">
      {showBrand && (
        <p
          className={cn(
            'font-display text-[11px] uppercase tracking-[0.22em] font-semibold',
            tone === 'report' ? 'text-[#F0D78A]' : 'text-muted-foreground',
          )}
        >
          {APP_NAME}
        </p>
      )}
      {label && (
        <motion.p
          className={cn(
            'text-sm font-medium',
            tone === 'report' ? 'text-[#F6F1E4]' : 'text-foreground',
          )}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {label}
        </motion.p>
      )}
      <CyclingSteps steps={cycle} tone={tone} />
      <div
        className={cn(
          'mt-2 h-1 w-40 overflow-hidden rounded-full',
          tone === 'report' ? 'bg-white/10' : 'bg-secondary',
        )}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            width: '42%',
            background:
              tone === 'report'
                ? 'linear-gradient(90deg, #C9A24B, #F0D78A, #E4C077)'
                : 'linear-gradient(90deg, #1C2739, #F7B731)',
          }}
          animate={{ x: ['-110%', '220%'] }}
          transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

export function PrismLoader({
  size = 'md',
  layout = 'block',
  label,
  showBrand = false,
  className,
  'aria-label': ariaLabel,
  steps,
}: PrismLoaderProps) {
  const statusLabel = ariaLabel ?? label ?? 'Loading'
  const mark = <LoaderMark size={size} />

  const content = (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {mark}
      <LoaderCopy label={label} showBrand={showBrand} steps={steps} />
    </motion.div>
  )

  if (layout === 'inline') {
    return (
      <span
        className={cn('inline-flex items-center gap-2', className)}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        <LoaderMark size={size === 'md' ? 'sm' : size} />
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </span>
    )
  }

  if (layout === 'report') {
    return (
      <div
        className={cn(
          'lg-report rounded-xl overflow-hidden border border-[var(--lg-line)] shadow-sm',
          className,
        )}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        <div
          className="relative flex min-h-[280px] flex-col items-center justify-center px-6 py-16 overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 700px 360px at 18% -10%, rgba(201,162,75,0.18), transparent 55%), linear-gradient(180deg, #0B1F3A 0%, #122A4D 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(246,241,228,0.035) 0 1px, transparent 1px 68px)',
            }}
            aria-hidden
          />
          <motion.div
            className="relative z-[1] flex w-full max-w-md flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoaderMark
              size={size === 'xs' || size === 'sm' ? 'md' : size}
              variant="heritage"
            />
            <LoaderCopy
              label={label}
              showBrand
              steps={
                steps ?? [
                  'Mapping topic signals…',
                  'Scoring readiness…',
                  'Composing report…',
                ]
              }
              tone="report"
            />
          </motion.div>
          <div
            className="absolute bottom-0 inset-x-0 h-1.5"
            style={{ background: '#C9A24B' }}
            aria-hidden
          />
        </div>
      </div>
    )
  }

  if (layout === 'fullscreen') {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm',
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

  if (layout === 'overlay') {
    return (
      <div
        className={cn(
          'absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[2px]',
          className,
        )}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        <div className="rounded-2xl border border-border bg-card px-8 py-10 shadow-lg">
          {content}
        </div>
      </div>
    )
  }

  if (layout === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-card px-6 py-16 text-center',
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
        className={cn(
          'absolute inset-0 z-10 flex items-center justify-center bg-background/60',
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

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-10', className)}
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
  variant = 'default',
  steps,
}: {
  label?: string
  className?: string
  minHeight?: boolean
  variant?: 'default' | 'report'
  steps?: string[]
}) {
  if (variant === 'report') {
    return (
      <div className={cn(minHeight && 'min-h-[240px]', className)}>
        <PrismLoader size="lg" layout="report" label={label} showBrand steps={steps} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center p-8',
        minHeight && 'min-h-[200px]',
        className,
      )}
    >
      <PrismLoader size="md" layout="block" label={label} steps={steps} />
    </div>
  )
}

/** Compact inline loading indicator */
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

/** Report pages — Learning Genome / Swotify heritage aesthetic */
export function ReportLoader({
  label = 'Composing report…',
  className,
  steps,
}: {
  label?: string
  className?: string
  steps?: string[]
}) {
  return (
    <PageLoader
      variant="report"
      label={label}
      className={className}
      steps={
        steps ?? [
          'Mapping topic signals…',
          'Scoring predictive readiness…',
          'Composing narrative…',
        ]
      }
    />
  )
}
