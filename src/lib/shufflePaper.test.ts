import { describe, expect, it } from 'vitest'
import {
  seededShuffle,
  shuffleQuestionsForStudent,
  shuffledMcqOptions,
  mcqOptionsForDisplay,
} from '@/lib/shufflePaper'

describe('shufflePaper', () => {
  it('is deterministic for the same seed', () => {
    const items = ['q1', 'q2', 'q3', 'q4', 'q5']
    expect(seededShuffle(items, 'same-seed')).toEqual(seededShuffle(items, 'same-seed'))
  })

  it('gives different students different question order', () => {
    const questions = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]
    const first = shuffleQuestionsForStudent(questions, 'ta-1', 'stu-a').map((q) => q.id)
    const other = ['stu-b', 'stu-c', 'stu-d', 'stu-e', 'stu-f']
      .map((id) => shuffleQuestionsForStudent(questions, 'ta-1', id).map((q) => q.id))
      .find((order) => order.join() !== first.join())
    expect(other).toBeDefined()
    expect(first.slice().sort()).toEqual(other!.slice().sort())
  })

  it('keeps the same order when a student reloads', () => {
    const questions = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]
    const first = shuffleQuestionsForStudent(questions, 'ta-9', 'stu-1')
    const reload = shuffleQuestionsForStudent(questions, 'ta-9', 'stu-1')
    expect(first).toEqual(reload)
  })

  it('relabels shuffled options A–D while preserving original keys for grading', () => {
    const question = {
      id: 'q-mcq',
      optionA: 'Paris',
      optionB: 'London',
      optionC: 'Berlin',
      optionD: 'Madrid',
    }
    const options = shuffledMcqOptions(question, 'ta-1', 'stu-a')
    expect(options.map((o) => o.displayKey)).toEqual(['A', 'B', 'C', 'D'])
    expect(options.map((o) => o.originalKey).sort()).toEqual(['A', 'B', 'C', 'D'])
    expect(new Set(options.map((o) => o.label))).toEqual(
      new Set(['Paris', 'London', 'Berlin', 'Madrid']),
    )

    const otherStudent = ['stu-b', 'stu-c', 'stu-d', 'stu-e', 'stu-f']
      .map((id) => shuffledMcqOptions(question, 'ta-1', id))
      .find((opts) => opts.map((o) => o.originalKey).join() !== options.map((o) => o.originalKey).join())
    expect(otherStudent).toBeDefined()
  })

  it('keeps bank order when shuffle is off', () => {
    const question = {
      id: 'q-mcq',
      optionA: 'Paris',
      optionB: 'London',
      optionC: 'Berlin',
      optionD: 'Madrid',
    }
    expect(mcqOptionsForDisplay(question, { shuffle: false, assessmentId: 'ta-1', studentId: 'stu-a' })).toEqual([
      { displayKey: 'A', originalKey: 'A', label: 'Paris' },
      { displayKey: 'B', originalKey: 'B', label: 'London' },
      { displayKey: 'C', originalKey: 'C', label: 'Berlin' },
      { displayKey: 'D', originalKey: 'D', label: 'Madrid' },
    ])
  })

  it('does not mutate the source list', () => {
    const questions = [{ id: '1' }, { id: '2' }, { id: '3' }]
    const snapshot = questions.map((q) => q.id)
    shuffleQuestionsForStudent(questions, 'ta-1', 'stu-a')
    expect(questions.map((q) => q.id)).toEqual(snapshot)
  })
})
