import { describe, expect, it } from 'vitest'
import { isMathematicsSubject, looksLikeLatex } from '@/lib/mathSubject'

describe('isMathematicsSubject', () => {
  it('matches common school maths names', () => {
    expect(isMathematicsSubject('Mathematics')).toBe(true)
    expect(isMathematicsSubject('maths')).toBe(true)
    expect(isMathematicsSubject('Math')).toBe(true)
    expect(isMathematicsSubject('Applied Mathematics')).toBe(true)
    expect(isMathematicsSubject('Additional Mathematics')).toBe(true)
  })

  it('rejects non-math subjects', () => {
    expect(isMathematicsSubject('Physics')).toBe(false)
    expect(isMathematicsSubject('English')).toBe(false)
    expect(isMathematicsSubject('')).toBe(false)
    expect(isMathematicsSubject(undefined)).toBe(false)
  })
})

describe('looksLikeLatex', () => {
  it('detects MathLive / TeX fragments', () => {
    expect(looksLikeLatex('\\frac{x^2 + 1}{\\sqrt{x}}')).toBe(true)
    expect(looksLikeLatex('x^2 + 1')).toBe(true)
    expect(looksLikeLatex('\\sin\\theta')).toBe(true)
  })

  it('leaves ordinary prose alone', () => {
    expect(looksLikeLatex('Solve the following question.')).toBe(false)
    expect(looksLikeLatex('(image)')).toBe(false)
    expect(looksLikeLatex('')).toBe(false)
  })
})
