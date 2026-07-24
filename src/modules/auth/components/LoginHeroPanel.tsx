import { ParticleBackground } from './ParticleBackground'
import { CscLogo } from './CscLogo'

interface LoginHeroPanelProps {
  headline: string
  subtitle: string
  footer?: string
}

export function LoginHeroPanel({ headline, subtitle, footer }: LoginHeroPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col min-h-screen">
      <div className="absolute inset-0 gradient-dark pointer-events-none" aria-hidden />
      <ParticleBackground />

      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-yellow-400/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 left-1/5 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]"
        aria-hidden
      />

      {/* Top institutional lockup */}
      <div className="relative z-10 px-10 xl:px-14 pt-10 pointer-events-none">
        <div className="inline-flex flex-col gap-1 rounded-[16px] glass-dark px-4 py-3 ios-shadow-md">
          <p className="text-[10px] font-display font-semibold uppercase tracking-[0.28em] text-yellow-300/80">
            Computer Software College
          </p>
          <p className="text-[11px] font-display font-medium text-white/50 tracking-wide">
            Centre Division · Prism Software
          </p>
        </div>
      </div>

      {/* Centre brand cluster */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 xl:px-14 py-8 pointer-events-none">
        <div className="flex flex-col items-center w-full max-w-lg">
          <CscLogo size="lg" variant="onDark" />

          <div className="mt-10 xl:mt-12 w-full text-center space-y-4">
            <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" aria-hidden />
            <h1 className="text-[26px] xl:text-[30px] font-display font-bold text-white leading-tight tracking-tight">
              {headline}
            </h1>
            <p className="text-[14px] xl:text-[15px] text-white/60 font-sans leading-relaxed max-w-md mx-auto">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {footer && (
        <div className="relative z-10 px-10 xl:px-14 pb-10 pointer-events-none">
          <p className="text-[10px] text-white/30 font-display uppercase tracking-[0.2em] text-center leading-relaxed">
            {footer}
          </p>
        </div>
      )}
    </div>
  )
}