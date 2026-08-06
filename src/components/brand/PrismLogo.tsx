import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { APP_NAME } from '@/lib/constants'

interface PrismLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  showTagline?: boolean
  className?: string
  href?: string
}

const sizes = {
  sm: { mark: 32, gap: 10, title: 'text-base', tag: 'text-[9px]' },
  md: { mark: 40, gap: 12, title: 'text-lg', tag: 'text-[10px]' },
  lg: { mark: 52, gap: 14, title: 'text-2xl', tag: 'text-[11px]' },
}

/** Unique Prism mark — refracted light through a geometric prism (navy + gold brand). */
export function PrismLogoMark({
  size = 32,
  className,
  idPrefix = 'prism',
}: {
  size?: number
  className?: string
  idPrefix?: string
}) {
  const gold = `${idPrefix}-gold`
  const navy = `${idPrefix}-navy`
  const beam = `${idPrefix}-beam`
  const glow = `${idPrefix}-glow`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={navy} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id={beam} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
          <stop offset="40%" stopColor="#4F46E5" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#E8B820" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="48" height="48" rx="12" fill={`url(#${navy})`} />
      <circle cx="24" cy="24" r="18" fill={`url(#${glow})`} />

      {/* Incoming light beam */}
      <path
        d="M6 24 H18"
        stroke={`url(#${beam})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Prism body */}
      <path
        d="M20 12 L34 24 L20 36 Z"
        fill={`url(#${gold})`}
        stroke="#FFECB3"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Refracted rays — intelligence split into insights */}
      <path d="M34 24 L44 14" stroke="#E8B820" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M34 24 L44 24" stroke="#5290DA" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M34 24 L44 34" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />

      {/* Inner facet highlight */}
      <path d="M23 18 L30 24 L23 30 Z" fill="white" fillOpacity="0.22" />
    </svg>
  )
}

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
      <PrismLogoMark size={s.mark} idPrefix={`prism-${size}`} />
      {showWordmark && (
        <div className="min-w-0">
          <div className={cn('font-display font-bold leading-none tracking-tight text-foreground', s.title)}>
            {APP_NAME}
            <span className="text-accent">+</span>
          </div>
          {showTagline && (
            <div className={cn('uppercase tracking-[0.18em] text-muted-foreground mt-1 truncate', s.tag)}>
              Academic Intelligence
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
