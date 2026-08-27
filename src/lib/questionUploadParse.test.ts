import { describe, expect, it } from 'vitest'
import { applyMappedTopics, validateQuestionUploadRow } from '@/lib/questionUploadParse'
import type { QuestionUploadRow } from '@/types'

function sample(
  overrides: Partial<Omit<QuestionUploadRow, 'valid' | 'errors'>> = {},
): Omit<QuestionUploadRow, 'valid' | 'errors'> {
  return {
    row: 2,
    board: 'CBSE',
    grade: '8',
    subject: 'Mathematics',
    chapter: 'Algebra',
    topic: '',
    difficulty: 'Medium',
    marks: 1,
    questionType: 'MCQ',
    text: 'Solve 2x = 4',
    optionA: '2',
    optionB: '4',
    optionC: '8',
    optionD: '1',
    correctAnswer: 'A',
    ...overrides,
  }
}

describe('question upload topic mapping', () => {
  it('treats topic as optional when chapter is present', () => {
    const row = validateQuestionUploadRow(sample({ topic: '' }))
    expect(row.valid).toBe(true)
    expect(row.topic).toBe('')
  })

  it('still requires chapter', () => {
    const row = validateQuestionUploadRow(sample({ chapter: '' }))
    expect(row.valid).toBe(false)
    expect(row.errors.join(' ')).toMatch(/chapter/i)
  })

  it('fills mapped topics onto matching rows', () => {
    const parsed = applyMappedTopics(
      [validateQuestionUploadRow(sample({ row: 2, topic: '' }))],
      [{ row: 2, topic: 'Linear Equations', chapter: 'Algebra' }],
    )
    expect(parsed[0].topic).toBe('Linear Equations')
    expect(parsed[0].valid).toBe(true)
  })
})
