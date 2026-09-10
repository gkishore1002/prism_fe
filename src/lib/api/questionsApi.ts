import { apiFetch } from '@/lib/apiClient'
import {
  mapQuestion,
  mapQuestionPaper,
  type ApiQuestion,
  type ApiQuestionPaper,
} from '@/lib/api/mappers'
import type { QuestionBankEntry, QuestionPaper, QuestionUploadRow } from '@/types'
import { totalMarksForQuestions, uniqueTopics } from '@/lib/questionPaperUtils'

export async function deleteQuestion(questionId: string): Promise<void> {
  await apiFetch(`/questions/${questionId}`, { method: 'DELETE' })
}

export async function deleteQuestionPaper(paperId: string): Promise<void> {
  await apiFetch(`/question-papers/${paperId}`, { method: 'DELETE' })
}

export async function fetchQuestions(): Promise<QuestionBankEntry[]> {
  const data = await apiFetch<ApiQuestion[]>('/questions')
  return data.map(mapQuestion)
}

export async function fetchQuestionPapers(): Promise<QuestionPaper[]> {
  const data = await apiFetch<ApiQuestionPaper[]>('/question-papers')
  return data.map(mapQuestionPaper)
}

function normalizeGrade(grade: string): string {
  return grade.startsWith('Grade') ? grade : `Grade ${grade}`
}

function normalizeDifficulty(value: string): QuestionBankEntry['difficulty'] {
  const d = value.toLowerCase()
  if (d === 'easy' || d === 'medium' || d === 'hard') return d
  return 'medium'
}

export type ManualQuestionInput = {
  board: string
  grade: string
  subject: string
  chapter: string
  topic: string
  text: string
  difficulty: QuestionBankEntry['difficulty']
  marks: number
  questionType: QuestionBankEntry['questionType']
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  textImageKey?: string
  optionAImageKey?: string
  optionBImageKey?: string
  optionCImageKey?: string
  optionDImageKey?: string
}

function manualInputToCreateBody(input: ManualQuestionInput) {
  const isMcq = input.questionType === 'mcq'
  return {
    board: input.board,
    grade: normalizeGrade(input.grade),
    subject: input.subject,
    chapter: input.chapter,
    topic: input.topic,
    text: input.text,
    difficulty: input.difficulty,
    marks: input.marks,
    questionType: input.questionType,
    optionA: isMcq ? input.optionA : undefined,
    optionB: isMcq ? input.optionB : undefined,
    optionC: isMcq ? input.optionC : undefined,
    optionD: isMcq ? input.optionD : undefined,
    correctAnswer: isMcq ? input.correctAnswer : undefined,
    textImageKey: input.textImageKey,
    optionAImageKey: isMcq ? input.optionAImageKey : undefined,
    optionBImageKey: isMcq ? input.optionBImageKey : undefined,
    optionCImageKey: isMcq ? input.optionCImageKey : undefined,
    optionDImageKey: isMcq ? input.optionDImageKey : undefined,
  }
}

function mapUploadQuestionType(
  value: string,
): QuestionBankEntry['questionType'] {
  const t = value.toLowerCase()
  if (t.includes('short')) return 'short'
  if (t.includes('long') || t.includes('essay')) return 'long'
  return 'mcq'
}

function uploadRowToCreateBody(row: QuestionUploadRow) {
  const questionType = mapUploadQuestionType(row.questionType)
  const isMcq = questionType === 'mcq'
  const hasA = Boolean(row.optionA?.trim() || row.optionAImageKey)
  const hasB = Boolean(row.optionB?.trim() || row.optionBImageKey)
  return {
    board: row.board,
    grade: normalizeGrade(row.grade),
    subject: row.subject,
    chapter: row.chapter,
    topic: row.topic,
    text: row.text,
    difficulty: normalizeDifficulty(row.difficulty),
    marks: row.marks,
    questionType,
    optionA: row.optionA ?? (isMcq && !row.optionAImageKey ? 'Option A' : undefined),
    optionB: row.optionB ?? (isMcq && !row.optionBImageKey ? 'Option B' : undefined),
    optionC: row.optionC ?? undefined,
    optionD: row.optionD ?? undefined,
    correctAnswer: row.correctAnswer ?? (isMcq ? 'A' : undefined),
    textImageKey: row.textImageKey,
    optionAImageKey: isMcq ? row.optionAImageKey : undefined,
    optionBImageKey: isMcq ? row.optionBImageKey : undefined,
    optionCImageKey: isMcq ? row.optionCImageKey : undefined,
    optionDImageKey: isMcq ? row.optionDImageKey : undefined,
    ...(isMcq && (!hasA || !hasB) ? {} : {}),
  }
}

export async function createPaperBulk(
  name: string,
  questions: Record<string, unknown>[],
  source: 'manual' | 'upload',
): Promise<QuestionPaper> {
  if (questions.length === 0) {
    throw new Error('No questions to save')
  }
  const data = await apiFetch<ApiQuestionPaper>('/question-papers/bulk', {
    method: 'POST',
    body: JSON.stringify({ name, questions, source }),
  })
  return mapQuestionPaper(data)
}

export async function createQuestionFromRow(row: QuestionUploadRow): Promise<QuestionBankEntry> {
  const data = await apiFetch<ApiQuestion>('/questions', {
    method: 'POST',
    body: JSON.stringify(uploadRowToCreateBody(row)),
  })
  return mapQuestion(data)
}

export async function updateQuestionApi(
  questionId: string,
  patch: Partial<Pick<QuestionBankEntry, 'text' | 'difficulty' | 'marks' | 'optionA' | 'optionB' | 'optionC' | 'optionD' | 'correctAnswer'>>,
): Promise<QuestionBankEntry> {
  const data = await apiFetch<ApiQuestion>(`/questions/${questionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      text: patch.text,
      difficulty: patch.difficulty,
      marks: patch.marks,
      optionA: patch.optionA,
      optionB: patch.optionB,
      optionC: patch.optionC,
      optionD: patch.optionD,
      correctAnswer: patch.correctAnswer,
    }),
  })
  return mapQuestion(data)
}

export async function createPaperFromQuestions(
  name: string,
  questions: QuestionBankEntry[],
): Promise<QuestionPaper> {
  if (questions.length === 0) {
    throw new Error('No questions to save')
  }
  const board = questions[0].board
  const grade = questions[0].grade
  const subjects = Array.from(
    new Set(questions.map((q) => q.subject.trim()).filter(Boolean)),
  )
  const subject = subjects[0] ?? questions[0].subject
  const questionIds = questions.map((q) => q.id)
  const data = await apiFetch<ApiQuestionPaper>('/question-papers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      board,
      grade,
      subject,
      subjects,
      questionIds,
      source: 'upload',
    }),
  })
  return mapQuestionPaper(data)
}

export async function createQuestionManual(input: ManualQuestionInput): Promise<QuestionBankEntry> {
  const data = await apiFetch<ApiQuestion>('/questions', {
    method: 'POST',
    body: JSON.stringify(manualInputToCreateBody(input)),
  })
  return mapQuestion(data)
}

export async function createPaperFromManualQuestions(
  name: string,
  inputs: ManualQuestionInput[],
): Promise<QuestionPaper> {
  return createPaperBulk(
    name,
    inputs.map((input) => manualInputToCreateBody(input)),
    'manual',
  )
}

export async function createPaperFromUpload(
  name: string,
  rows: QuestionUploadRow[],
): Promise<QuestionPaper> {
  const valid = rows.filter((r) => r.valid)
  if (valid.length === 0) {
    throw new Error('No valid questions to save. Fix errors and re-upload.')
  }

  const { uploadQuestionMediaBlob } = await import('@/lib/api/questionMediaApi')

  const prepared: QuestionUploadRow[] = []
  for (const row of valid) {
    const next = { ...row }
    const pairs: Array<[keyof QuestionUploadRow, keyof QuestionUploadRow, string]> = [
      ['textImageBlob', 'textImageKey', 'stem.jpg'],
      ['optionAImageBlob', 'optionAImageKey', 'option-a.jpg'],
      ['optionBImageBlob', 'optionBImageKey', 'option-b.jpg'],
      ['optionCImageBlob', 'optionCImageKey', 'option-c.jpg'],
      ['optionDImageBlob', 'optionDImageKey', 'option-d.jpg'],
    ]
    for (const [blobKey, keyField, filename] of pairs) {
      const blob = next[blobKey] as Blob | undefined
      if (blob && !next[keyField]) {
        const uploaded = await uploadQuestionMediaBlob(blob, filename)
        ;(next as Record<string, unknown>)[keyField] = uploaded.key
      }
    }
    prepared.push(next)
  }

  return createPaperBulk(
    name,
    prepared.map((row) => uploadRowToCreateBody(row)),
    'upload',
  )
}

export async function createCustomPaperApi(
  name: string,
  parentPaperId: string,
  questionIds: string[],
): Promise<QuestionPaper> {
  const data = await apiFetch<ApiQuestionPaper>('/question-papers/custom', {
    method: 'POST',
    body: JSON.stringify({ name, parentPaperId, questionIds }),
  })
  return mapQuestionPaper(data)
}

export function enrichPaper(paper: QuestionPaper, questions: QuestionBankEntry[]): QuestionPaper {
  const qs = questions.filter((q) => paper.questionIds.includes(q.id))
  return {
    ...paper,
    topics: paper.topics.length ? paper.topics : uniqueTopics(qs),
    totalMarks: paper.totalMarks || totalMarksForQuestions(qs),
  }
}
