import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import {
  APP_NAME,
  APP_TAGLINE,
  APP_WORKFLOW,
  BRAND_LOGO_FULL,
  BRAND_MARK,
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

function BrandMarkImage({
  src,
  size = 32,
  className,
  alt = '',
}: {
  src: string
  size?: number
  className?: string
  alt?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      draggable={false}
      aria-hidden={!alt}
    />
  )
}

/** Brand mark — stylized P with gold prism and book pages. */
export function PrismLogoMark({
  size = 32,
  className,
  idPrefix: _idPrefix = 'prism',
}: {
  size?: number
  className?: string
  idPrefix?: string
}) {
  return <BrandMarkImage src={BRAND_MARK} size={size} className={className} />
}

/** Animated mark for login / hero entrances */
export function PrismLogoMarkMotion({
  size = 72,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <motion.img
      src={BRAND_MARK}
      alt=""
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      draggable={false}
      aria-hidden
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}

/** Full brand lockup image — login / marketing */
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
    <BrandMarkImage src={BRAND_MARK_DARK} size={size} className={className} />
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
      <PrismLogoMark size={s.mark} />
      {showWordmark && (
        <div className="min-w-0">
          <div
            className={cn(
              'font-display font-extrabold leading-none tracking-[0.08em] uppercase text-ink',
              s.title,
            )}
          >
            {APP_NAME}
            <span className="inline-block ml-0.5 w-1.5 h-1.5 rounded-[1px] bg-[#F7B731] rotate-45 translate-y-[-6px] align-top" />
          </div>
          {showTagline && (
            <div className={cn('uppercase tracking-[0.12em] text-[#F7B731] mt-1 truncate font-semibold', s.tag)}>
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
        <span className="inline-block ml-1 w-2 h-2 rounded-[1px] bg-[#F7B731] rotate-45 -translate-y-3 align-top" />
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F7B731]">
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
                    backgroundColor: ['#8B5CF6', '#0CBF6E', '#F7B731'][i] ?? '#8B5CF6',
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
