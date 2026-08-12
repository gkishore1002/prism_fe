import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CSC_INACTIVITY_DAYS,
  DEFAULT_CSC_WARNING_DAYS,
  formatCscInactivityLabel,
  isCscUrgent,
} from '@/lib/cscPolicy'

describe('cscPolicy', () => {
  it('isCscUrgent uses warning threshold', () => {
    expect(isCscUrgent(14, 14)).toBe(true)
    expect(isCscUrgent(15, 14)).toBe(false)
    expect(isCscUrgent(null, 14)).toBe(false)
  })

  it('defaults match institution policy fallbacks', () => {
    expect(DEFAULT_CSC_INACTIVITY_DAYS).toBe(90)
    expect(DEFAULT_CSC_WARNING_DAYS).toBe(14)
  })

  it('formatCscInactivityLabel includes day count', () => {
    expect(formatCscInactivityLabel(90)).toContain('90')
  })
})
