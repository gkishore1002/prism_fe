import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'
import {
  APP_NAME,
  APP_TAGLINE,
  APP_WORKFLOW,
  BRAND_ACCENT,
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
  sm: { mark: 36, gap: 10, title: 'text-[15px]', tag: 'text-[8px]' },
  md: { mark: 44, gap: 12, title: 'text-lg', tag: 'text-[9px]' },
  lg: { mark: 72, gap: 14, title: 'text-2xl', tag: 'text-[10px]' },
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
      className={cn('shrink-0 rounded-xl object-contain', className)}
      draggable={false}
      aria-hidden={!alt}
    />
  )
}

/** Brand mark — P with gold prism and open book. */
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
      className={cn('shrink-0 rounded-2xl object-contain', className)}
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
  maxWidth = 200,
}: {
  className?: string
  maxWidth?: number
}) {
  return (
    <img
      src={BRAND_LOGO_FULL}
      alt={`${APP_NAME} — ${APP_TAGLINE}`}
      className={cn('h-auto w-full rounded-2xl object-contain', className)}
      style={{ maxWidth }}
      draggable={false}
    />
  )
}

/** Login form logo — 3D sideways twist-in with soft glow */
export function PrismLogoFullMotion({
  className,
  maxWidth = 148,
}: {
  className?: string
  maxWidth?: number
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <PrismLogoFull maxWidth={maxWidth} className={cn('mx-auto', className)} />
  }

  return (
    <div
      className={cn('relative mx-auto flex justify-center', className)}
      style={{ maxWidth, perspective: 1000 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 0.55, 0.28], scale: [0.7, 1.15, 1] }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 199, 0, 0.35) 0%, rgba(0, 59, 122, 0.12) 45%, transparent 72%)',
          filter: 'blur(14px)',
        }}
        aria-hidden
      />

      <motion.div
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d', maxWidth }}
        initial={{
          opacity: 0,
          rotateY: -88,
          rotateX: 14,
          scale: 0.82,
          y: 10,
          filter: 'blur(6px)',
        }}
        animate={{
          opacity: 1,
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
        }}
        transition={{
          duration: 1.05,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.55, ease: 'easeOut' },
          filter: { duration: 0.75, ease: 'easeOut' },
        }}
        whileHover={{
          rotateY: -10,
          rotateX: 4,
          scale: 1.03,
          transition: { type: 'spring', stiffness: 260, damping: 22 },
        }}
      >
        <motion.div
          animate={{
            rotateY: [0, 5, -5, 0],
            y: [0, -3, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1.2,
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <PrismLogoFull maxWidth={maxWidth} className="mx-auto drop-shadow-[0_12px_28px_rgba(0,59,122,0.18)]" />
        </motion.div>
      </motion.div>
    </div>
  )
}

/** Dark-background icon mark */
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
            <span
              className="inline-block ml-0.5 w-1.5 h-1.5 rounded-[1px] rotate-45 translate-y-[-6px] align-top"
              style={{ backgroundColor: BRAND_ACCENT }}
            />
          </div>
          {showTagline && (
            <div
              className={cn('uppercase tracking-[0.12em] mt-1 truncate font-semibold', s.tag)}
              style={{ color: BRAND_ACCENT }}
            >
              {APP_TAGLINE}
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link to={href} className={cn('min-w-0 hover:opacity-90 transition-opacity', className)}>
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
  markSize = 120,
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
        <PrismLogoFull maxWidth={markSize} />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <PrismLogoMarkMotion size={markSize} />
      <div className="mt-5 font-display font-extrabold text-3xl tracking-[0.12em] uppercase text-white">
        {APP_NAME}
        <span
          className="inline-block ml-1 w-2 h-2 rounded-[1px] rotate-45 -translate-y-3 align-top"
          style={{ backgroundColor: BRAND_ACCENT }}
        />
      </div>
      <p
        className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: BRAND_ACCENT }}
      >
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
                    backgroundColor: ['#003B7A', '#0CBF6E', BRAND_ACCENT][i] ?? '#003B7A',
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
