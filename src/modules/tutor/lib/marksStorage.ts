export type MarksSource = 'manual' | 'upload'

export interface MarksRecord {
  id: string
  sessionId?: string
  studentId: string
  studentName: string
  batch: string
  assessmentTitle: string
  description?: string
  subject: string
  maxMarks: number
  scoredMarks: number
  percentage: number
  source: MarksSource
  conductedOn: string
  savedAt: string
}

export interface MarksActivitySession {
  sessionId: string
  assessmentTitle: string
  description?: string
  batch: string
  savedAt: string
  source: MarksSource
  entries: MarksRecord[]
}

/** Rebuild spreadsheet shape from a saved session (for read-only view). */
export function sessionToSpreadsheet(session: MarksActivitySession): {
  students: { id: string; name: string }[]
  columns: Array<{ id: string; subject: string; conductedOn: string; maxMarks: number }>
  marks: Record<string, Record<string, string>>
} {
  const studentMap = new Map<string, string>()
  for (const entry of session.entries) {
    studentMap.set(entry.studentId, entry.studentName)
  }
  const students = [...studentMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const columnKey = (entry: MarksRecord) =>
    `${entry.subject}\0${entry.conductedOn}\0${entry.maxMarks}`

  const columnByKey = new Map<
    string,
    { id: string; subject: string; conductedOn: string; maxMarks: number }
  >()

  for (const entry of session.entries) {
    const key = columnKey(entry)
    if (!columnByKey.has(key)) {
      columnByKey.set(key, {
        id: `col-${key.replace(/[^\w]+/g, '-').slice(0, 80)}`,
        subject: entry.subject,
        conductedOn: entry.conductedOn,
        maxMarks: entry.maxMarks,
      })
    }
  }

  const columns = [...columnByKey.values()].sort(
    (a, b) =>
      a.subject.localeCompare(b.subject) || a.conductedOn.localeCompare(b.conductedOn),
  )

  const marks: Record<string, Record<string, string>> = {}
  for (const col of columns) marks[col.id] = {}

  for (const entry of session.entries) {
    const key = columnKey(entry)
    const col = columnByKey.get(key)
    if (col) marks[col.id][entry.studentId] = String(entry.scoredMarks)
  }

  return { students, columns, marks }
}

export function groupMarksBySession(records: MarksRecord[]): MarksActivitySession[] {
  const map = new Map<string, MarksActivitySession>()
  for (const record of records) {
    const sessionId =
      record.sessionId ??
      `legacy-${record.savedAt}|${record.assessmentTitle}|${record.batch}|${record.source}`
    let session = map.get(sessionId)
    if (!session) {
      session = {
        sessionId,
        assessmentTitle: record.assessmentTitle,
        description: record.description,
        batch: record.batch,
        savedAt: record.savedAt,
        source: record.source,
        entries: [],
      }
      map.set(sessionId, session)
    }
    session.entries.push(record)
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  )
}


export function pct(scored: number, max: number): number {
  if (max <= 0) return 0
  return Math.round((scored / max) * 100)
}

function csvEscape(value: string | number): string {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function normalizeCsvCell(value: string): string {
  return value.trim().replace(/^\uFEFF/, '')
}

/** Parse CSV text with quoted fields. */
export function parseCsvText(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  const source = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    const next = source[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i += 1
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(normalizeCsvCell(cell))
      cell = ''
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(normalizeCsvCell(cell))
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      cell = ''
      if (ch === '\r') i += 1
    } else if (ch !== '\r') {
      cell += ch
    }
  }

  row.push(normalizeCsvCell(cell))
  if (row.some((value) => value !== '')) rows.push(row)
  return rows
}

export interface SpreadsheetColumnDraft {
  subject: string
  maxMarks: number
  conductedOn: string
}

export function buildSpreadsheetTemplateCsv(
  students: { id: string; name: string }[],
  columns: SpreadsheetColumnDraft[],
  meta?: { title?: string; batch?: string },
): string {
  const rows: (string | number)[][] = []
  if (meta?.title || meta?.batch) {
    rows.push([meta.title ?? '', meta.batch ?? ''])
  }
  rows.push(['#', 'Student', ...columns.map((c) => c.subject)])
  rows.push(['', '', ...columns.map((c) => `/ ${c.maxMarks}`)])
  rows.push(['', '', ...columns.map((c) => c.conductedOn)])
  students.forEach((student, index) => {
    rows.push([index + 1, student.name, ...columns.map(() => '')])
  })
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

export type ParsedSpreadsheetUpload =
  | {
      ok: true
      title?: string
      batchLabel?: string
      columns: SpreadsheetColumnDraft[]
      marksByStudentName: Map<string, string[]>
    }
  | { ok: false; error: string }

function parseMaxMarks(raw: string): number {
  const match = raw.match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 50
}

function isHeaderRow(row: string[]): boolean {
  const first = normalizeCsvCell(row[0] ?? '').toLowerCase()
  const second = normalizeCsvCell(row[1] ?? '').toLowerCase()
  return first === '#' && second === 'student'
}

/** Parse wide spreadsheet CSV (same layout as manual entry / export). */
export function parseSpreadsheetMarksCsv(text: string): ParsedSpreadsheetUpload {
  const rows = parseCsvText(text.trim())
  if (rows.length < 4) {
    return { ok: false, error: 'File is empty or missing header rows.' }
  }

  let startRow = 0
  let title: string | undefined
  let batchLabel: string | undefined

  if (!isHeaderRow(rows[0])) {
    if (rows.length < 5 || !isHeaderRow(rows[1])) {
      return {
        ok: false,
        error: 'Expected spreadsheet format: #, Student, then subject columns with / max and date rows.',
      }
    }
    title = rows[0][0]?.trim() || undefined
    batchLabel = rows[0][1]?.trim() || undefined
    startRow = 1
  }

  const header = rows[startRow]
  const maxRow = rows[startRow + 1] ?? []
  const dateRow = rows[startRow + 2] ?? []
  const subjects = header.slice(2).map((value) => value.trim())

  if (subjects.length === 0 || subjects.every((value) => !value)) {
    return { ok: false, error: 'No subject columns found in the header row.' }
  }

  const columns: SpreadsheetColumnDraft[] = subjects.map((subject, index) => ({
    subject,
    maxMarks: parseMaxMarks(maxRow[2 + index] ?? '50'),
    conductedOn: (dateRow[2 + index] ?? new Date().toISOString().slice(0, 10)).trim(),
  }))

  const marksByStudentName = new Map<string, string[]>()
  for (const row of rows.slice(startRow + 3)) {
    if (!row.some((cell) => cell.trim())) continue
    const name = normalizeCsvCell(row[1] ?? '')
    if (!name) continue
    marksByStudentName.set(name, row.slice(2, 2 + columns.length).map((cell) => normalizeCsvCell(cell)))
  }

  if (marksByStudentName.size === 0) {
    return { ok: false, error: 'No student mark rows found below the header.' }
  }

  const hasAnyMarks = [...marksByStudentName.values()].some((values) =>
    values.some((value) => value !== ''),
  )
  if (!hasAnyMarks) {
    return { ok: false, error: 'No marks found in the file. Fill at least one score before uploading.' }
  }

  return { ok: true, title, batchLabel, columns, marksByStudentName }
}

function normalizeName(value: string): string {
  return normalizeCsvCell(value).toLowerCase()
}

/** Export one session (or records) in the same wide spreadsheet layout as the UI. */
export function exportMarksSpreadsheetFile(
  records: MarksRecord[],
  filename = 'prism-marks-export.csv',
  sessionMeta?: Pick<MarksActivitySession, 'assessmentTitle' | 'batch'>,
): void {
  if (records.length === 0) return

  const session: MarksActivitySession = sessionMeta
    ? {
        sessionId: records[0].sessionId ?? 'export',
        assessmentTitle: sessionMeta.assessmentTitle,
        batch: sessionMeta.batch,
        savedAt: records[0].savedAt,
        source: records[0].source,
        entries: records,
      }
    : {
        sessionId: records[0].sessionId ?? 'export',
        assessmentTitle: records[0].assessmentTitle,
        batch: records[0].batch,
        savedAt: records[0].savedAt,
        source: records[0].source,
        entries: records,
      }

  const { students, columns, marks } = sessionToSpreadsheet(session)
  const rows: (string | number)[][] = []
  rows.push([session.assessmentTitle, session.batch])
  rows.push(['#', 'Student', ...columns.map((c) => c.subject)])
  rows.push(['', '', ...columns.map((c) => `/ ${c.maxMarks}`)])
  rows.push(['', '', ...columns.map((c) => c.conductedOn)])
  students.forEach((student, index) => {
    const line: (string | number)[] = [index + 1, student.name]
    for (const col of columns) {
      const raw = marks[col.id]?.[student.id]
      line.push(raw === undefined || raw === '' ? '' : Number(raw))
    }
    rows.push(line)
  })

  downloadCsvText(
    rows.map((row) => row.map(csvEscape).join(',')).join('\n'),
    filename,
  )
}

export function downloadCsvText(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Apply parsed spreadsheet marks onto batch students (match by name). */
export function applyParsedSpreadsheetToGrid(
  students: { id: string; name: string }[],
  columns: Array<{ id: string; subject: string; conductedOn: string; maxMarks: number }>,
  marksByStudentName: Map<string, string[]>,
): { marks: Record<string, Record<string, string>>; matched: number; unmatched: string[] } {
  const marks: Record<string, Record<string, string>> = {}
  for (const col of columns) marks[col.id] = {}

  const byName = new Map(students.map((s) => [normalizeName(s.name), s]))
  const unmatched: string[] = []
  let matched = 0

  for (const [name, values] of marksByStudentName) {
    const student = byName.get(normalizeName(name))
    if (!student) {
      unmatched.push(name)
      continue
    }
    matched += 1
    columns.forEach((col, index) => {
      const raw = values[index]
      if (raw) marks[col.id][student.id] = raw
    })
  }

  return { marks, matched, unmatched }
}

/** @deprecated Use exportMarksSpreadsheetFile — kept as alias */
export function exportMarksRecordsToCsv(
  records: MarksRecord[],
  filename = 'prism-marks-export.csv',
): void {
  exportMarksSpreadsheetFile(records, filename)
}
