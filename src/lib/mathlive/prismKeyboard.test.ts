import { describe, expect, it } from 'vitest'
import { MATH_KEYBOARD_INSTRUCTIONS, PRISM_MATH_LAYOUTS } from '@/lib/mathlive/prismKeyboard'

describe('prism math keyboard', () => {
  it('includes school layouts with fractions and roots', () => {
    const labels = PRISM_MATH_LAYOUTS.map((layout) => layout.label)
    expect(labels).toEqual(['School', 'Algebra', 'Calculus', 'Trig', 'Greek'])
    const schoolKeys = PRISM_MATH_LAYOUTS[0]?.rows.flat().map((key) => key.label) ?? []
    expect(schoolKeys).toEqual(expect.arrayContaining(['√', 'x²', 'a/b', 'sin', 'π']))
  })

  it('lists usage instructions', () => {
    expect(MATH_KEYBOARD_INSTRUCTIONS.length).toBeGreaterThanOrEqual(5)
    expect(MATH_KEYBOARD_INSTRUCTIONS[0]).toMatch(/click/i)
  })
})
