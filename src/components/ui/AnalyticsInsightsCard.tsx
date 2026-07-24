import { Sparkles } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { cn } from '@/lib/cn'

interface AnalyticsInsightsCardProps {
  className?: string
  title?: string
  bullets: string[]
  emptyMessage?: string
}

export function AnalyticsInsightsCard({
  className,
  title = 'Insights from your data',
  bullets,
  emptyMessage = 'Insights will appear once students have assessment or marks data.',
}: AnalyticsInsightsCardProps) {
  return (
    <AppCard
      className={cn(
        'accent-indigo border-indigo-200/60 bg-indigo-50/40',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[14px] bg-indigo-100 text-indigo-600 grid place-items-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-display font-semibold uppercase tracking-[0.15em] text-indigo-700">
            {title}
          </p>
          {bullets.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-1">{emptyMessage}</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              {bullets.map((bullet, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-indigo-500 shrink-0">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppCard>
  )
}
