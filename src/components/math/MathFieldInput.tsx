import { useRef } from 'react'
import { cn } from '@/lib/cn'
import { applyKeyToText, type MathInsertTarget } from '@/lib/mathlive/mathTarget'
import { looksLikeLatex } from '@/lib/mathSubject'
import { MathContent } from '@/components/math/MathContent'

interface MathFieldInputProps {
  value: string
  onChange: (latex: string) => void
  placeholder?: string
  compact?: boolean
  onActivate?: (target: MathInsertTarget) => void
  'aria-label'?: string
}

export function MathFieldInput({
  value,
  onChange,
  placeholder = 'Type the question. Use the math keys below for fractions, roots, and symbols.',
  compact = false,
  onActivate,
  'aria-label': ariaLabel,
}: MathFieldInputProps) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const onActivateRef = useRef(onActivate)

  valueRef.current = value
  onChangeRef.current = onChange
  onActivateRef.current = onActivate

  function makeTarget(): MathInsertTarget {
    return {
      focus: () => inputRef.current?.focus(),
      applyKey: (key) => {
        const input = inputRef.current
        if (!input) return
        const start = input.selectionStart ?? valueRef.current.length
        const end = input.selectionEnd ?? valueRef.current.length
        const result = applyKeyToText(valueRef.current, start, end, key)
        onChangeRef.current(result.next)
        window.requestAnimationFrame(() => {
          input.focus()
          input.setSelectionRange(result.caret, result.caret)
        })
      },
    }
  }

  function bindInput(node: HTMLTextAreaElement | HTMLInputElement | null) {
    inputRef.current = node
    if (node) onActivateRef.current?.(makeTarget())
  }

  const fieldClass = cn(compact ? 'ios-input' : 'ios-input min-h-[5.5rem] resize-y')

  return (
    <div className="space-y-2">
      {compact ? (
        <input
          ref={bindInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onActivateRef.current?.(makeTarget())}
          className={fieldClass}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      ) : (
        <textarea
          ref={bindInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onActivateRef.current?.(makeTarget())}
          rows={3}
          className={fieldClass}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      )}
      {!compact && looksLikeLatex(value) ? (
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Preview</p>
          <MathContent text={value} />
        </div>
      ) : null}
    </div>
  )
}
