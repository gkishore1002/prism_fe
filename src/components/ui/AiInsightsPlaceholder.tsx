import { Sparkles } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { cn } from '@/lib/cn'

interface AiInsightsPlaceholderProps {
  className?: string
  title?: string
}

export function AiInsightsPlaceholder({
  className,
  title = 'AI insights — coming soon',
}: AiInsightsPlaceholderProps) {
  return (
    <AppCard
      className={cn(
        'accent-indigo border-dashed bg-indigo-50/40 border-indigo-200/60',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[14px] bg-indigo-100 text-indigo-600 grid place-items-center shrink-0">
          <Sparkles className="w-4 h-4 ai-pulse" />
        </div>
        <div>
          <p className="text-[10px] font-display font-semibold uppercase tracking-[0.15em] text-indigo-700">
            Intelligence layer
          </p>
          <p className="text-sm text-foreground mt-0.5">{title}</p>
        </div>
      </div>
    </AppCard>
  )
}