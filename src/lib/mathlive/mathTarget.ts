import type { PrismMathCommand } from '@/lib/mathlive/prismKeyboard'

export interface MathInsertTarget {
  focus: () => void
  applyKey: (key: { insert?: string; command?: PrismMathCommand }) => void
}

export function fillLatexTemplate(template: string, selected: string): string {
  if (template.includes('#@') || template.includes('#0') || template.includes('#?')) {
    return template
      .replaceAll('#@', selected)
      .replaceAll('#0', selected)
      .replaceAll('#?', '')
  }
  return selected ? `${selected}${template}` : template
}

export function applyKeyToText(
  value: string,
  start: number,
  end: number,
  key: { insert?: string; command?: PrismMathCommand },
): { next: string; caret: number } {
  const from = Math.min(start, end)
  const to = Math.max(start, end)
  const selected = value.slice(from, to)

  if (key.command === 'backspace') {
    if (from !== to) {
      return { next: value.slice(0, from) + value.slice(to), caret: from }
    }
    if (from === 0) return { next: value, caret: 0 }
    return { next: value.slice(0, from - 1) + value.slice(to), caret: from - 1 }
  }

  if (key.command === 'left') {
    return { next: value, caret: Math.max(0, from - 1) }
  }

  if (key.command === 'right') {
    return { next: value, caret: Math.min(value.length, to + 1) }
  }

  if (!key.insert) return { next: value, caret: to }

  const inserted = fillLatexTemplate(key.insert, selected)
  return {
    next: value.slice(0, from) + inserted + value.slice(to),
    caret: from + inserted.length,
  }
}
