import { useState } from 'react'
import { PRISM_MATH_LAYOUTS, type PrismMathKey } from '@/lib/mathlive/prismKeyboard'
import type { MathInsertTarget } from '@/lib/mathlive/mathTarget'
import { MathHelpButton } from '@/components/math/MathHelpButton'
import { cn } from '@/lib/cn'

interface PrismMathKeyboardProps {
  getTarget: () => MathInsertTarget | null
}

export function PrismMathKeyboard({ getTarget }: PrismMathKeyboardProps) {
  const [layoutId, setLayoutId] = useState(PRISM_MATH_LAYOUTS[0]?.id ?? 'school')
  const layout = PRISM_MATH_LAYOUTS.find((item) => item.id === layoutId) ?? PRISM_MATH_LAYOUTS[0]

  function press(key: PrismMathKey) {
    const target = getTarget()
    if (!target) return
    target.applyKey(key)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2 sm:p-3 print:hidden">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">Math keyboard</p>
        <MathHelpButton />
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {PRISM_MATH_LAYOUTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setLayoutId(item.id)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              item.id === layoutId
                ? 'bg-ink text-paper'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {layout?.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-1 sm:grid-cols-10">
            {row.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.title ?? item.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => press(item)}
                className="h-9 rounded-md border border-border bg-secondary/40 text-sm font-medium text-foreground hover:border-sapphire-400 hover:bg-card"
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Click the question or an option first, then tap a key. Letters can be typed on your keyboard.
      </p>
    </div>
  )
}
