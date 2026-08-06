import * as XLSX from 'xlsx'
import type { QuestionUploadRow } from '@/types'
import { QUESTION_UPLOAD_TEMPLATE_ROWS } from '@/lib/questionUploadTemplate'

const QUESTION_FILE_RE = /\.(xlsx|xls|csv|json)$/i

export const QUESTION_UPLOAD_COLUMNS = [
  'Board',
  'Grade',
  'Subject',
  'Chapter',
  'Topic',
  'Difficulty',
  'Marks',
  'Question Type',
  'Question Text',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Correct Answer',
] as const

type RawQuestionRecord = Record<string, unknown>

export type QuestionUploadParseResult =
  | { ok: true; rows: QuestionUploadRow[]; suggestedName?: string }
  | { ok: false; error: string }

export function isQuestionUploadFileName(name: string): boolean {
  return QUESTION_FILE_RE.test(name)
}

function cell(value: unknown): string {
  if (value == null) return ''
  return String(value).trim().replace(/^\uFEFF/, '')
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9]+/g, '')
}

const FIELD_ALIASES: Record<string, string[]> = {
  board: ['board'],
  grade: ['grade', 'class', 'std', 'standard'],
  subject: ['subject'],
  chapter: ['chapter', 'unit'],
  topic: ['topic', 'subtopic'],
  difficulty: ['difficulty', 'level'],
  marks: ['marks', 'mark', 'points', 'score'],
  questionType: ['questiontype', 'type', 'qtype'],
  text: ['questiontext', 'question', 'text', 'prompt'],
  optionA: ['optiona', 'a', 'choicea'],
  optionB: ['optionb', 'b', 'choiceb'],
  optionC: ['optionc', 'c', 'choicec'],
  optionD: ['optiond', 'd', 'choiced'],
  correctAnswer: ['correctanswer', 'answer', 'correct', 'key'],
}

function pickField(record: RawQuestionRecord, field: keyof typeof FIELD_ALIASES): string {
  const aliases = FIELD_ALIASES[field]
  const entries = Object.entries(record)
  for (const [rawKey, rawValue] of entries) {
    const key = normalizeKey(rawKey)
    if (aliases.includes(key)) return cell(rawValue)
  }
  return ''
}

function normalizeDifficulty(value: string): string {
  const d = value.trim().toLowerCase()
  if (!d) return ''
  if (d === 'easy' || d === 'e') return 'Easy'
  if (d === 'medium' || d === 'med' || d === 'm') return 'Medium'
  if (d === 'hard' || d === 'h') return 'Hard'
  return value.trim()
}

function normalizeQuestionType(value: string): string {
  const t = value.trim().toLowerCase()
  if (!t) return 'MCQ'
  if (t.includes('short')) return 'Short'
  if (t.includes('long') || t.includes('essay')) return 'Long'
  if (t.includes('mcq') || t.includes('multiple')) return 'MCQ'
  return value.trim()
}

function isMcqType(questionType: string): boolean {
  const t = questionType.toLowerCase()
  return !t.includes('short') && !t.includes('long') && !t.includes('essay')
}

function parseMarks(value: string): number {
  const n = Number(String(value).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

function validateRow(partial: Omit<QuestionUploadRow, 'valid' | 'errors'>): QuestionUploadRow {
  const errors: string[] = []
  if (!partial.board) errors.push('Board is required')
  if (!partial.grade) errors.push('Grade is required')
  if (!partial.subject) errors.push('Subject is required')
  if (!partial.chapter) errors.push('Chapter is required')
  if (!partial.topic) errors.push('Topic is required')
  if (!partial.text) errors.push('Question text is required')

  const diff = partial.difficulty.toLowerCase()
  if (!diff) errors.push('Difficulty is required')
  else if (!['easy', 'medium', 'hard'].includes(diff)) {
    errors.push('Difficulty must be Easy / Medium / Hard')
  }

  if (!Number.isFinite(partial.marks) || partial.marks <= 0) {
    errors.push('Marks must be a positive number')
  }

  if (isMcqType(partial.questionType)) {
    if (!partial.optionA || !partial.optionB) {
      errors.push('MCQs require Option A and Option B')
    }
    if (!partial.correctAnswer) {
      errors.push('Correct answer is required for MCQs')
    } else {
      const ans = partial.correctAnswer.trim().toUpperCase()
      if (!['A', 'B', 'C', 'D'].includes(ans) && ans.length > 1) {
        // allow full option text; only flag empty already handled
      } else if (['A', 'B', 'C', 'D'].includes(ans)) {
        partial = { ...partial, correctAnswer: ans }
      }
    }
  }

  return {
    ...partial,
    valid: errors.length === 0,
    errors,
  }
}

function recordToRow(record: RawQuestionRecord, rowNumber: number): QuestionUploadRow {
  const difficulty = normalizeDifficulty(pickField(record, 'difficulty'))
  const questionType = normalizeQuestionType(pickField(record, 'questionType'))
  const marksRaw = pickField(record, 'marks')
  return validateRow({
    row: rowNumber,
    board: pickField(record, 'board'),
    grade: pickField(record, 'grade').replace(/^grade\s*/i, ''),
    subject: pickField(record, 'subject'),
    chapter: pickField(record, 'chapter'),
    topic: pickField(record, 'topic'),
    difficulty,
    marks: parseMarks(marksRaw || '1'),
    questionType,
    text: pickField(record, 'text'),
    optionA: pickField(record, 'optionA') || undefined,
    optionB: pickField(record, 'optionB') || undefined,
    optionC: pickField(record, 'optionC') || undefined,
    optionD: pickField(record, 'optionD') || undefined,
    correctAnswer: pickField(record, 'correctAnswer') || undefined,
  })
}

function matrixToRecords(matrix: string[][]): RawQuestionRecord[] {
  if (matrix.length === 0) return []
  const headerIdx = matrix.findIndex((row) =>
    row.some((c) => {
      const k = normalizeKey(c)
      return k === 'board' || k === 'questiontext' || k === 'question'
    }),
  )
  if (headerIdx < 0) {
    throw new Error(
      'Could not find a header row. Include columns like Board, Grade, Subject, Question Text.',
    )
  }
  const headers = matrix[headerIdx].map((h) => cell(h))
  const records: RawQuestionRecord[] = []
  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const row = matrix[i]
    if (!row || row.every((c) => !cell(c))) continue
    const record: RawQuestionRecord = {}
    headers.forEach((header, col) => {
      if (!header) return
      record[header] = row[col] ?? ''
    })
    records.push(record)
  }
  return records
}

function parseDelimitedText(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '')
  const firstLine = cleaned.split(/\r?\n/).find((l) => l.trim()) ?? ''
  const counts = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  }
  const delimiter =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ','

  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    const next = cleaned[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === delimiter) {
      current.push(field)
      field = ''
      continue
    }
    if (ch === '\n' || (ch === '\r' && next === '\n')) {
      current.push(field)
      rows.push(current)
      current = []
      field = ''
      if (ch === '\r') i++
      continue
    }
    if (ch === '\r') {
      current.push(field)
      rows.push(current)
      current = []
      field = ''
      continue
    }
    field += ch
  }
  current.push(field)
  if (current.some((c) => cell(c))) rows.push(current)
  return rows
}

function readExcelMatrix(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })
  return matrix.map((row) =>
    (Array.isArray(row) ? row : []).map((c) => cell(c)),
  )
}

function extractJsonQuestions(payload: unknown): {
  questions: RawQuestionRecord[]
  suggestedName?: string
} {
  if (Array.isArray(payload)) {
    return { questions: payload as RawQuestionRecord[] }
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    const suggestedName =
      typeof obj.name === 'string'
        ? obj.name
        : typeof obj.paperName === 'string'
          ? obj.paperName
          : typeof obj.title === 'string'
            ? obj.title
            : undefined
    const list = obj.questions ?? obj.items ?? obj.data
    if (Array.isArray(list)) {
      return { questions: list as RawQuestionRecord[], suggestedName }
    }
  }
  throw new Error(
    'JSON must be an array of questions, or an object with a "questions" array.',
  )
}

function toUploadRows(
  records: RawQuestionRecord[],
  rowOffset = 2,
): QuestionUploadRow[] {
  return records.map((record, idx) => recordToRow(record, rowOffset + idx))
}

export async function parseQuestionUploadFile(file: File): Promise<QuestionUploadParseResult> {
  const name = file.name || 'upload'
  if (!isQuestionUploadFileName(name)) {
    return {
      ok: false,
      error: 'Unsupported file. Use .xlsx, .xls, .csv, or .json.',
    }
  }

  try {
    const ext = name.split('.').pop()?.toLowerCase() ?? ''

    if (ext === 'json') {
      const text = await file.text()
      const payload = JSON.parse(text) as unknown
      const { questions, suggestedName } = extractJsonQuestions(payload)
      if (questions.length === 0) {
        return { ok: false, error: 'No questions found in the JSON file.' }
      }
      return { ok: true, rows: toUploadRows(questions), suggestedName }
    }

    if (ext === 'csv') {
      const text = await file.text()
      const records = matrixToRecords(parseDelimitedText(text))
      if (records.length === 0) {
        return { ok: false, error: 'No question rows found in the CSV.' }
      }
      return { ok: true, rows: toUploadRows(records) }
    }

    const buffer = await file.arrayBuffer()
    const records = matrixToRecords(readExcelMatrix(buffer))
    if (records.length === 0) {
      return { ok: false, error: 'No question rows found in the spreadsheet.' }
    }
    return { ok: true, rows: toUploadRows(records) }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not parse this file.'
    return { ok: false, error: message }
  }
}

function templateSampleRows(): string[][] {
  return QUESTION_UPLOAD_TEMPLATE_ROWS.filter((r) => r.valid).map((r) => [
    r.board,
    r.grade,
    r.subject,
    r.chapter,
    r.topic,
    r.difficulty,
    String(r.marks),
    r.questionType,
    r.text,
    r.optionA ?? '',
    r.optionB ?? '',
    r.optionC ?? '',
    r.optionD ?? '',
    r.correctAnswer ?? '',
  ])
}

export function downloadQuestionExcelTemplate(
  filename = 'prism-question-upload-template.xlsx',
): void {
  const aoa = [Array.from(QUESTION_UPLOAD_COLUMNS), ...templateSampleRows()]
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Questions')
  XLSX.writeFile(workbook, filename)
}

export function downloadQuestionJsonTemplate(
  filename = 'prism-question-upload-template.json',
): void {
  const questions = QUESTION_UPLOAD_TEMPLATE_ROWS.filter((r) => r.valid).map((r) => ({
    board: r.board,
    grade: r.grade,
    subject: r.subject,
    chapter: r.chapter,
    topic: r.topic,
    difficulty: r.difficulty,
    marks: r.marks,
    questionType: r.questionType,
    text: r.text,
    optionA: r.optionA,
    optionB: r.optionB,
    optionC: r.optionC,
    optionD: r.optionD,
    correctAnswer: r.correctAnswer,
  }))
  const payload = {
    name: 'Sample Grade 8 Math Paper',
    questions,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
