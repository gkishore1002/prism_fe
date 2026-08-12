import { motion } from 'framer-motion'
import { BarChart3, Sparkles, Target } from 'lucide-react'
import { ParticleBackground } from './ParticleBackground'
import { PrismBrandLockup } from '@/components/brand/PrismLogo'
import { fadeUp, springSoft, staggerContainer, staggerItem } from '@/lib/motion'
import { APP_ORG, APP_WORKFLOW } from '@/lib/constants'

interface LoginHeroPanelProps {
  headline: string
  subtitle: string
  footer?: string
}

const floatingCards = [
  {
    icon: BarChart3,
    label: 'Institution analytics',
    value: '+12%',
    tone: 'text-sky-300',
    delay: 0,
    x: '8%',
    y: '18%',
  },
  {
    icon: Target,
    label: 'Exam readiness',
    value: '87%',
    tone: 'text-emerald-300',
    delay: 0.15,
    x: '62%',
    y: '28%',
  },
  {
    icon: Sparkles,
    label: 'AI insights',
    value: 'Live',
    tone: 'text-violet-300',
    delay: 0.3,
    x: '18%',
    y: '68%',
  },
] as const

export function LoginHeroPanel({ headline, subtitle, footer }: LoginHeroPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] relative overflow-hidden flex-col min-h-screen border-r border-white/10 gradient-dark">
      <ParticleBackground variant="dark" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-[#0065F3]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-20 h-64 w-64 rounded-full bg-[#2A7DFF]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0065F3]/10 via-transparent to-[#131B2E]/40"
        aria-hidden
      />

      {floatingCards.map((card) => (
        <motion.div
          key={card.label}
          className="pointer-events-none absolute z-[2] hidden xl:flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          style={{ left: card.x, top: card.y }}
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{
            opacity: 1,
            y: [0, -8, 0],
            scale: 1,
          }}
          transition={{
            opacity: { duration: 0.5, delay: 0.4 + card.delay },
            y: { duration: 5 + card.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: card.delay },
            scale: { duration: 0.45, delay: 0.35 + card.delay, ...springSoft },
          }}
        >
          <card.icon className={`w-4 h-4 shrink-0 ${card.tone}`} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/50">{card.label}</p>
            <p className={`text-sm font-semibold font-mono-data ${card.tone}`}>{card.value}</p>
          </div>
        </motion.div>
      ))}

      <motion.div
        className="relative z-10 px-10 xl:px-12 pt-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <div className="inline-flex flex-col gap-0.5 rounded-xl glass-dark px-3.5 py-2.5">
          <p className="text-[10px] font-display font-semibold uppercase tracking-[0.22em] text-sky-300">
            Computer Software College
          </p>
          <p className="text-[11px] font-medium text-white/60 tracking-wide">
            Centre Division · {APP_ORG}
          </p>
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 xl:px-12 py-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center w-full max-w-md">
          <motion.div variants={staggerItem}>
            <PrismBrandLockup variant="dark" showWorkflow={false} markSize={96} />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 xl:mt-10 w-full text-center space-y-3">
            <div
              className="h-px w-14 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent"
              aria-hidden
            />
            <h1 className="text-2xl xl:text-[28px] font-display font-bold text-white leading-snug tracking-tight">
              {headline}
            </h1>
            <p className="text-sm text-white/65 leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {APP_WORKFLOW.map((step, i) => (
              <motion.span
                key={step}
                className="inline-flex items-center gap-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.06, duration: 0.35 }}
              >
                <span>{step}</span>
                {i < APP_WORKFLOW.length - 1 && (
                  <motion.span
                    className="h-1 w-1 rounded-full bg-[#0065F3]"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  />
                )}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {footer && (
        <motion.div
          className="relative z-10 px-10 xl:px-12 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <p className="text-[10px] text-white/45 font-display uppercase tracking-[0.18em] text-center leading-relaxed">
            {footer}
          </p>
        </motion.div>
      )}
    </div>
  )
}
