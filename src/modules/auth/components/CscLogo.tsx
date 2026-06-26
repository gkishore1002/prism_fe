import { cn } from '@/lib/cn'

interface CscLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'onDark' | 'onLight'
  className?: string
  showTagline?: boolean
}

const sizes = {
  sm: { width: 160, tagMain: 8, tagSub: 7, tagProduct: 6 },
  md: { width: 220, tagMain: 10, tagSub: 8, tagProduct: 7 },
  lg: { width: 300, tagMain: 12, tagSub: 10, tagProduct: 8 },
}

const taglineStyles = {
  onDark: {
    college: 'text-yellow-300/95',
    centre: 'text-blue-200/90',
    product: 'text-white/45',
  },
  onLight: {
    college: 'text-blue-800',
    centre: 'text-blue-600',
    product: 'text-text-muted',
  },
}

/** CSC block logo — yellow face, navy extrusion. CSC = Computer Software College */
export function CscLogo({
  size = 'md',
  variant = 'onDark',
  className,
  showTagline = true,
}: CscLogoProps) {
  const s = sizes[size]
  const tags = taglineStyles[variant]
  const filterId = `csc-shadow-${size}`
  const yellowId = `csc-yellow-${size}`
  const blueId = `csc-blue-${size}`

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Logo mark with ambient glow */}
      <div className="relative">
        <div
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none',
            variant === 'onDark' ? 'w-[120%] h-[80%] bg-yellow-400/15' : 'w-[110%] h-[70%] bg-yellow-300/25',
          )}
          aria-hidden
        />
        <svg
          width={s.width}
          height={s.width * 0.37}
          viewBox="0 0 300 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-[0_12px_28px_rgba(12,34,56,0.45)]"
          aria-label="Computer Software College — CSC"
        >
          <defs>
            <linearGradient id={yellowId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD966" />
              <stop offset="50%" stopColor="#F5C830" />
              <stop offset="100%" stopColor="#E8B820" />
            </linearGradient>
            <linearGradient id={blueId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2A60A8" />
              <stop offset="100%" stopColor="#163A66" />
            </linearGradient>
            <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0c2238" floodOpacity="0.5" />
            </filter>
          </defs>

          <text x="18" y="78" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="82" fill={`url(#${blueId})`} transform="translate(6, 7)">C</text>
          <text x="18" y="78" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="82" fill={`url(#${yellowId})`} stroke="#1E4A82" strokeWidth="3" filter={`url(#${filterId})`}>C</text>

          <text x="108" y="78" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="82" fill={`url(#${blueId})`} transform="translate(6, 7)">S</text>
          <text x="108" y="78" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="82" fill={`url(#${yellowId})`} stroke="#1E4A82" strokeWidth="3" filter={`url(#${filterId})`}>S</text>

          <text x="198" y="78" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="82" fill={`url(#${blueId})`} transform="translate(6, 7)">C</text>
          <text x="198" y="78" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="82" fill={`url(#${yellowId})`} stroke="#1E4A82" strokeWidth="3" filter={`url(#${filterId})`}>C</text>
        </svg>
      </div>

      {showTagline && (
        <div className="mt-5 text-center max-w-[320px] space-y-1.5">
          <p
            className={cn('font-display font-bold uppercase leading-snug tracking-[0.14em]', tags.college)}
            style={{ fontSize: s.tagMain }}
          >
            Computer Software College
          </p>
          <p
            className={cn('font-display font-semibold uppercase tracking-[0.18em]', tags.centre)}
            style={{ fontSize: s.tagSub }}
          >
            Centre · Learnova Software
          </p>
          <p
            className={cn('font-display font-medium uppercase tracking-[0.22em] pt-0.5', tags.product)}
            style={{ fontSize: s.tagProduct }}
          >
            Academic Intelligence Platform
          </p>
        </div>
      )}
    </div>
  )
}
