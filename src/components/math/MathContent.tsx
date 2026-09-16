import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { looksLikeLatex } from '@/lib/mathSubject'
import { convertLatexToMarkupSafe } from '@/lib/mathlive/renderLatex'

interface MathContentProps {
  text?: string
  className?: string
}

export function MathContent({ text, className }: MathContentProps) {
  const [html, setHtml] = useState<string | null>(null)
  const value = text?.trim() ?? ''
  const shouldRenderMath = looksLikeLatex(value)

  useEffect(() => {
    if (!shouldRenderMath || !value) {
      setHtml(null)
      return
    }
    let cancelled = false
    void convertLatexToMarkupSafe(value)
      .then((markup) => {
        if (!cancelled) setHtml(markup)
      })
      .catch(() => {
        if (!cancelled) setHtml(null)
      })
    return () => {
      cancelled = true
    }
  }, [shouldRenderMath, value])

  if (!value || value === '(image)') return null

  if (html) {
    return <span className={cn('prism-math-content', className)} dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <span className={className}>{text}</span>
}
