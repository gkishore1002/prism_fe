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
    optionA: row.optionA ?? (isMcq ? 'Option A' : undefined),
    optionB: row.optionB ?? (isMcq ? 'Option B' : undefined),
    optionC: row.optionC ?? (isMcq ? 'Option C' : undefined),
    optionD: row.optionD ?? (isMcq ? 'Option D' : undefined),
    correctAnswer: row.correctAnswer ?? (isMcq ? 'A' : undefined),
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
  const subject = questions[0].subject
  const questionIds = questions.map((q) => q.id)
  const data = await apiFetch<ApiQuestionPaper>('/question-papers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      board,
      grade,
      subject,
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
  return createPaperBulk(
    name,
    valid.map((row) => uploadRowToCreateBody(row)),
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
