import { describe, expect, it, beforeEach } from 'vitest'
import { clearExamProgress, loadExamProgress, saveExamProgress } from '@/lib/examProgress'

describe('examProgress', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('round-trips saved answers for resume', () => {
    saveExamProgress('stu-1', {
      assessmentId: 'ta-1',
      answers: { 'q-1': 'B', 'q-2': 'A' },
      flaggedIds: ['q-2'],
      currentIndex: 1,
      remainingSeconds: 420,
      savedAt: Date.now(),
    })
    const loaded = loadExamProgress('ta-1', 'stu-1')
    expect(loaded?.answers).toEqual({ 'q-1': 'B', 'q-2': 'A' })
    expect(loaded?.flaggedIds).toEqual(['q-2'])
    expect(loaded?.currentIndex).toEqual(1)
    expect(loaded?.remainingSeconds).toEqual(420)
  })

  it('clears progress after submit', () => {
    saveExamProgress('stu-1', {
      assessmentId: 'ta-1',
      answers: { 'q-1': 'A' },
      flaggedIds: [],
      currentIndex: 0,
      remainingSeconds: 10,
      savedAt: Date.now(),
    })
    clearExamProgress('ta-1', 'stu-1')
    expect(loadExamProgress('ta-1', 'stu-1')).toBeNull()
  })
})
