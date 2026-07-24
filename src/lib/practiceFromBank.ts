import type { QuestionBankEntry } from '@/types'

export interface PracticeQuestion {
  id: string
  topic: string
  marks: number
  difficulty: string
  q: string
  options: string[]
  correct: number
  solution: string
}

function buildOptions(q: QuestionBankEntry): string[] {
  return [q.optionA, q.optionB, q.optionC, q.optionD].filter(
    (o): o is string => Boolean(o),
  )
}

function correctIndex(q: QuestionBankEntry, options: string[]): number {
  if (!q.correctAnswer) return 0
  const letterIdx = q.correctAnswer.charCodeAt(0) - 65
  if (letterIdx >= 0 && letterIdx < options.length) return letterIdx
  const byText = options.findIndex((o) => o === q.correctAnswer)
  return byText >= 0 ? byText : 0
}

export function practiceFromBank(questions: QuestionBankEntry[], limit = 10): PracticeQuestion[] {
  const mcqs = questions.filter(
    (q) => q.questionType === 'mcq' && buildOptions(q).length >= 2,
  )
  return mcqs.slice(0, limit).map((q) => {
    const options = buildOptions(q)
    const correctIdx = correctIndex(q, options)
    return {
      id: q.id,
      topic: `${q.subject} · ${q.topic}`,
      marks: q.marks,
      difficulty: q.difficulty,
      q: q.text,
      options,
      correct: correctIdx,
      solution: 'Review the topic in your study plan.',
    }
  })
}
