import { apiFetch } from '@/lib/apiClient'

export interface SyllabusBook {
  id: string
  board: string
  grade: string
  subject: string
  title: string
  filename: string
  status: 'analyzing' | 'analyzed' | 'failed'
  analysisJson?: {
    chapters?: { title: string; topics: string[] }[]
  } | null
  errorMessage?: string
  createdAt: string
  chapterCount: number
  topicCount: number
  hasSourceText?: boolean
}

export type McqDifficulty = 'easy' | 'medium' | 'hard'

export interface GeneratedMcq {
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  marks: number
  difficulty: McqDifficulty
  chapter: string
  topic: string
}

export interface McqTopicSelection {
  chapter: string
  topic: string
}

export interface GenerateMcqsResult {
  bookId: string
  board: string
  grade: string
  subject: string
  chapter: string
  topic: string
  difficulty: McqDifficulty
  questions: GeneratedMcq[]
  selections?: McqTopicSelection[]
}

export interface ApproveMcqsResult {
  saved: number
  questionIds: string[]
  status: 'draft' | 'active'
}

export async function fetchSyllabusBooks(): Promise<SyllabusBook[]> {
  return apiFetch<SyllabusBook[]>('/syllabus-books')
}

export async function fetchSyllabusBook(bookId: string): Promise<SyllabusBook> {
  return apiFetch<SyllabusBook>(`/syllabus-books/${encodeURIComponent(bookId)}`)
}

export async function uploadSyllabusBook(input: {
  file: File
  board: string
  grade: string
  subject: string
  title?: string
}): Promise<SyllabusBook> {
  const body = new FormData()
  body.append('file', input.file)
  body.append('board', input.board)
  body.append('grade', input.grade)
  body.append('subject', input.subject)
  if (input.title) body.append('title', input.title)
  return apiFetch<SyllabusBook>('/syllabus-books', { method: 'POST', body })
}

export async function deleteSyllabusBook(bookId: string): Promise<void> {
  await apiFetch(`/syllabus-books/${encodeURIComponent(bookId)}`, { method: 'DELETE' })
}

export interface SyllabusChapterDraft {
  title: string
  topics: string[]
}

export async function updateSyllabusBookOutline(
  bookId: string,
  chapters: SyllabusChapterDraft[],
): Promise<SyllabusBook> {
  return apiFetch(`/syllabus-books/${encodeURIComponent(bookId)}/outline`, {
    method: 'PUT',
    body: JSON.stringify({ chapters }),
  })
}

export async function approveSyllabusBook(
  bookId: string,
  chapters?: SyllabusChapterDraft[],
): Promise<SyllabusBook> {
  return apiFetch(`/syllabus-books/${encodeURIComponent(bookId)}/approve`, {
    method: 'POST',
    body: JSON.stringify(chapters ? { chapters } : {}),
  })
}

export async function importBookTopics(bookId: string): Promise<{ status: string; topicsAdded: number }> {
  return apiFetch(`/syllabus-books/${encodeURIComponent(bookId)}/import-topics`, { method: 'POST' })
}

export async function downloadSyllabusBookJson(book: SyllabusBook): Promise<void> {
  const detail =
    book.status === 'analyzed' && book.analysisJson?.chapters
      ? book
      : await fetchSyllabusBook(book.id)
  const outline = detail.analysisJson ?? { chapters: [] }
  const payload = {
    title: detail.title,
    board: detail.board,
    grade: detail.grade,
    subject: detail.subject,
    filename: detail.filename,
    createdAt: detail.createdAt,
    chapters: outline.chapters ?? [],
  }
  const slug = [detail.board, detail.grade, detail.subject, detail.title]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug || 'syllabus-outline'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface TopicMapping {
  row: number
  topic: string
  chapter: string
}

export async function mapQuestionTopics(
  questions: {
    row: number
    board: string
    grade: string
    subject: string
    chapter: string
    text: string
    topic: string
  }[],
): Promise<{ mappings: TopicMapping[]; bookIds: string[] }> {
  return apiFetch('/syllabus-books/map-topics', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  })
}

export async function generateMcqsFromBook(
  bookId: string,
  body: {
    selections: McqTopicSelection[]
    difficulty: McqDifficulty
    count: number
    avoidStems?: string[]
    /** @deprecated Prefer selections */
    chapter?: string
    /** @deprecated Prefer selections */
    topic?: string
  },
): Promise<GenerateMcqsResult> {
  return apiFetch<GenerateMcqsResult>(
    `/syllabus-books/${encodeURIComponent(bookId)}/generate-mcqs`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export async function approveMcqsFromBook(
  bookId: string,
  body: {
    difficulty: McqDifficulty
    status: 'draft' | 'active'
    questions: GeneratedMcq[]
    chapter?: string
    topic?: string
  },
): Promise<ApproveMcqsResult> {
  return apiFetch<ApproveMcqsResult>(
    `/syllabus-books/${encodeURIComponent(bookId)}/approve-mcqs`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}
