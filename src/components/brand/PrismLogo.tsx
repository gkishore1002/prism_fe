import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import {
  APP_NAME,
  APP_TAGLINE,
  APP_WORKFLOW,
  BRAND_LOGO_FULL,
  BRAND_MARK_DARK,
} from '@/lib/constants'

interface PrismLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  showTagline?: boolean
  className?: string
  href?: string
}

const sizes = {
  sm: { mark: 32, gap: 10, title: 'text-[15px]', tag: 'text-[8px]' },
  md: { mark: 40, gap: 12, title: 'text-lg', tag: 'text-[9px]' },
  lg: { mark: 56, gap: 14, title: 'text-2xl', tag: 'text-[10px]' },
}

/** Brand mark — stylized P with spectrum prism + motion lines (light-friendly SVG). */
export function PrismLogoMark({
  size = 32,
  className,
  idPrefix = 'prism',
}: {
  size?: number
  className?: string
  idPrefix?: string
}) {
  const prism = `${idPrefix}-prism`
  const body = `${idPrefix}-body`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={body} x1="20%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A3A6E" />
          <stop offset="55%" stopColor="#131B2E" />
          <stop offset="100%" stopColor="#0F1B2D" />
        </linearGradient>
        <linearGradient id={prism} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="45%" stopColor="#0065F3" />
          <stop offset="100%" stopColor="#FF950A" />
        </linearGradient>
      </defs>

      {/* Motion lines */}
      <rect x="4" y="16" width="14" height="3.5" rx="1.75" fill="#8B5CF6" />
      <rect x="2" y="24" width="18" height="3.5" rx="1.75" fill="#0065F3" />
      <rect x="6" y="32" width="12" height="3.5" rx="1.75" fill="#2DD4BF" />
      <rect x="4" y="40" width="15" height="3.5" rx="1.75" fill="#22C55E" />
      <rect x="8" y="48" width="10" height="3.5" rx="1.75" fill="#FF950A" />

      {/* Stylized P body */}
      <path
        d="M24 10 H42 C52 10 58 16.5 58 26 C58 35.5 52 42 42 42 H34 V54 H24 V10 Z"
        fill={`url(#${body})`}
      />
      {/* Prism triangle counter */}
      <path d="M34 18 L48 28 L34 38 Z" fill={`url(#${prism})`} />
      <path d="M34 18 L48 28 L34 28 Z" fill="white" fillOpacity="0.18" />
    </svg>
  )
}

/** Animated mark for login / hero entrances */
export function PrismLogoMarkMotion({
  size = 72,
  className,
}: {
  size?: number
  className?: string
}) {
  const lines = [
    { y: 16, w: 14, x: 4, color: '#8B5CF6', delay: 0 },
    { y: 24, w: 18, x: 2, color: '#0065F3', delay: 0.05 },
    { y: 32, w: 12, x: 6, color: '#2DD4BF', delay: 0.1 },
    { y: 40, w: 15, x: 4, color: '#22C55E', delay: 0.15 },
    { y: 48, w: 10, x: 8, color: '#FF950A', delay: 0.2 },
  ]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="prism-motion-body" x1="20%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A7DFF" />
          <stop offset="50%" stopColor="#0065F3" />
          <stop offset="100%" stopColor="#131B2E" />
        </linearGradient>
        <linearGradient id="prism-motion-facet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="45%" stopColor="#0065F3" />
          <stop offset="100%" stopColor="#FF950A" />
        </linearGradient>
      </defs>

      {lines.map((line) => (
        <motion.rect
          key={line.y}
          x={line.x}
          y={line.y}
          height={3.5}
          rx={1.75}
          fill={line.color}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: line.w, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.15 + line.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      <motion.path
        d="M24 10 H42 C52 10 58 16.5 58 26 C58 35.5 52 42 42 42 H34 V54 H24 V10 Z"
        fill="url(#prism-motion-body)"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        style={{ transformOrigin: '40px 32px' }}
      />
      <motion.path
        d="M34 18 L48 28 L34 38 Z"
        fill="url(#prism-motion-facet)"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.28 }}
        style={{ transformOrigin: '40px 28px' }}
      />
    </svg>
  )
}

/** Full brand lockup image (wordmark + taglines) — login / marketing */
export function PrismLogoFull({
  className,
  maxWidth = 280,
}: {
  className?: string
  maxWidth?: number
}) {
  return (
    <img
      src={BRAND_LOGO_FULL}
      alt={`${APP_NAME} — ${APP_TAGLINE}`}
      className={cn('h-auto w-full object-contain', className)}
      style={{ maxWidth }}
      draggable={false}
    />
  )
}

/** Dark-background icon mark — navy hero panels */
export function PrismLogoMarkDark({
  size = 96,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <img
      src={BRAND_MARK_DARK}
      alt=""
      width={size}
      height={size}
      className={cn('object-contain', className)}
      draggable={false}
      aria-hidden
    />
  )
}

/** Compact app chrome logo: mark + PRISM wordmark */
export function PrismLogo({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  className,
  href,
}: PrismLogoProps) {
  const s = sizes[size]
  const content = (
    <div className={cn('flex items-center min-w-0', className)} style={{ gap: s.gap }}>
      <PrismLogoMark size={s.mark} idPrefix={`prism-${size}-${showWordmark ? 'w' : 'm'}`} />
      {showWordmark && (
        <div className="min-w-0">
          <div
            className={cn(
              'font-display font-extrabold leading-none tracking-[0.08em] uppercase text-ink',
              s.title,
            )}
          >
            {APP_NAME}
            <span className="inline-block ml-0.5 w-1.5 h-1.5 rounded-[1px] bg-[#8B5CF6] rotate-45 translate-y-[-6px] align-top" />
          </div>
          {showTagline && (
            <div className={cn('uppercase tracking-[0.12em] text-[#8B5CF6] mt-1 truncate font-semibold', s.tag)}>
              {APP_TAGLINE}
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link to={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}

/** Login / hero brand stack with workflow line */
export function PrismBrandLockup({
  variant = 'light',
  className,
  showWorkflow = true,
  markSize = 88,
}: {
  variant?: 'light' | 'dark'
  className?: string
  /** Shown on dark lockups only; hero panels often render workflow separately */
  showWorkflow?: boolean
  markSize?: number
}) {
  if (variant === 'light') {
    return (
      <div className={cn('flex flex-col items-center text-center', className)}>
        <PrismLogo size="lg" showTagline />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <PrismLogoMarkMotion size={markSize} />
      <div className="mt-5 font-display font-extrabold text-3xl tracking-[0.12em] uppercase text-white">
        {APP_NAME}
        <span className="inline-block ml-1 w-2 h-2 rounded-[1px] bg-[#8B5CF6] rotate-45 -translate-y-3 align-top" />
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A78BFA]">
        {APP_TAGLINE}
      </p>
      {showWorkflow && (
        <div className="mt-4 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70">
          <span className="h-px w-6 bg-white/25" />
          {APP_WORKFLOW.map((step, i) => (
            <span key={step} className="inline-flex items-center gap-2">
              <span>{step}</span>
              {i < APP_WORKFLOW.length - 1 && (
                <span
                  className="h-1 w-1 rounded-full"
                  style={{
                    backgroundColor: ['#8B5CF6', '#2DD4BF', '#FF950A'][i] ?? '#8B5CF6',
                  }}
                />
              )}
            </span>
          ))}
          <span className="h-px w-6 bg-white/25" />
        </div>
      )}
    </div>
  )
}
