import { describe, expect, it } from 'vitest'
import { applyKeyToText, fillLatexTemplate } from '@/lib/mathlive/mathTarget'

describe('mathTarget', () => {
  it('fills fraction and root templates', () => {
    expect(fillLatexTemplate('\\frac{#@}{#?}', 'x')).toBe('\\frac{x}{}')
    expect(fillLatexTemplate('\\sqrt{#0}', 'x+1')).toBe('\\sqrt{x+1}')
    expect(fillLatexTemplate('#@^{2}', 'x')).toBe('x^{2}')
  })

  it('inserts at the caret', () => {
    expect(applyKeyToText('ab', 1, 1, { insert: '+' })).toEqual({ next: 'a+b', caret: 2 })
  })

  it('deletes the selection', () => {
    expect(applyKeyToText('abcd', 1, 3, { command: 'backspace' })).toEqual({
      next: 'ad',
      caret: 1,
    })
  })
})
