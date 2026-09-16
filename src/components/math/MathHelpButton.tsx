import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { MATH_KEYBOARD_INSTRUCTIONS } from '@/lib/mathlive/prismKeyboard'
import { cn } from '@/lib/cn'

interface MathHelpButtonProps {
  className?: string
  align?: 'start' | 'end'
}

export function MathHelpButton({ className, align = 'end' }: MathHelpButtonProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-sapphire-400 hover:text-foreground"
        aria-label="How to use the math keyboard"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="How to use the math keyboard"
          className={cn(
            'absolute z-[80] mt-2 w-[min(22rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-card p-3 shadow-card-raised',
            align === 'start' ? 'left-0' : 'right-0',
          )}
        >
          <p className="text-xs font-semibold text-foreground">How to enter maths</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[12px] leading-snug text-muted-foreground">
            {MATH_KEYBOARD_INSTRUCTIONS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
