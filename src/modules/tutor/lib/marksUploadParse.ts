import * as XLSX from 'xlsx'
import {
  applyParsedSpreadsheetToGrid,
  buildSpreadsheetTemplateCsv,
  downloadCsvText,
  parseCsvText,
  type ParsedSpreadsheetUpload,
  type SpreadsheetColumnDraft,
} from '@/modules/tutor/lib/marksStorage'

export { applyParsedSpreadsheetToGrid, type ParsedSpreadsheetUpload }

const MARKS_FILE_RE = /\.(csv|txt|tsv|xlsx|xls)$/i

export function isMarksUploadFileName(name: string): boolean {
  return MARKS_FILE_RE.test(name)
}

function normalizeCsvCell(value: string): string {
  return value.trim().replace(/^\uFEFF/, '')
}

function formatSpreadsheetCell(cell: unknown): string {
  if (cell == null || cell === '') return ''
  if (cell instanceof Date) {
    if (Number.isNaN(cell.getTime())) return ''
    return cell.toISOString().slice(0, 10)
  }
  return normalizeCsvCell(String(cell))
}

function detectDelimiter(sample: string): string {
  const line = sample.split(/\r?\n/).find((row) => row.trim()) ?? ''
  const counts: Record<string, number> = {
    ',': (line.match(/,/g) ?? []).length,
    ';': (line.match(/;/g) ?? []).length,
    '\t': (line.match(/\t/g) ?? []).length,
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return best && best[1] > 0 ? best[0] : ','
}

function parseDelimitedText(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(cleaned)
  return parseCsvText(cleaned, delimiter)
}

function readExcelRows(buffer: ArrayBuffer): string[][] {
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
    (Array.isArray(row) ? row : []).map((cell) => formatSpreadsheetCell(cell)),
  )
}

function isHeaderRow(row: string[]): boolean {
  const first = normalizeCsvCell(row[0] ?? '').toLowerCase()
  const second = normalizeCsvCell(row[1] ?? '').toLowerCase()
  return first === '#' && second === 'student'
}

function parseMaxMarks(raw: string): number {
  const match = raw.match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 50
}

function finalizeParsedUpload(
  columns: SpreadsheetColumnDraft[],
  marksByStudentName: Map<string, string[]>,
  meta?: { title?: string; batchLabel?: string },
): ParsedSpreadsheetUpload {
  if (marksByStudentName.size === 0) {
    return { ok: false, error: 'No student mark rows found in the file.' }
  }
  const hasAnyMarks = [...marksByStudentName.values()].some((values) =>
    values.some((value) => value !== ''),
  )
  if (!hasAnyMarks) {
    return { ok: false, error: 'No marks found in the file. Fill at least one score before uploading.' }
  }
  return { ok: true, title: meta?.title, batchLabel: meta?.batchLabel, columns, marksByStudentName }
}

function tryParseWideFormat(rows: string[][]): ParsedSpreadsheetUpload {
  if (rows.length < 4) {
    return { ok: false, error: 'File is empty or missing header rows.' }
  }

  let startRow = 0
  let title: string | undefined
  let batchLabel: string | undefined

  if (!isHeaderRow(rows[0])) {
    if (rows.length < 5 || !isHeaderRow(rows[1])) {
      return { ok: false, error: 'Not a Prism wide template.' }
    }
    title = normalizeCsvCell(rows[0][0] ?? '') || undefined
    batchLabel = normalizeCsvCell(rows[0][1] ?? '') || undefined
    startRow = 1
  }

  const header = rows[startRow]
  const maxRow = rows[startRow + 1] ?? []
  const dateRow = rows[startRow + 2] ?? []
  const subjects = header.slice(2).map((value) => normalizeCsvCell(value))

  if (subjects.length === 0 || subjects.every((value) => !value)) {
    return { ok: false, error: 'No subject columns found in the header row.' }
  }

  const columns: SpreadsheetColumnDraft[] = subjects.map((subject, index) => ({
    subject,
    maxMarks: parseMaxMarks(maxRow[2 + index] ?? '50'),
    conductedOn: normalizeCsvCell(dateRow[2 + index] ?? '') || new Date().toISOString().slice(0, 10),
  }))

  const marksByStudentName = new Map<string, string[]>()
  for (const row of rows.slice(startRow + 3)) {
    if (!row.some((cell) => normalizeCsvCell(cell))) continue
    const name = normalizeCsvCell(row[1] ?? '')
    if (!name) continue
    marksByStudentName.set(
      name,
      row.slice(2, 2 + columns.length).map((cell) => normalizeCsvCell(cell)),
    )
  }

  return finalizeParsedUpload(columns, marksByStudentName, { title, batchLabel })
}

function tryParseLegacyFormat(rows: string[][]): ParsedSpreadsheetUpload {
  if (rows.length < 2) {
    return { ok: false, error: 'File has no data rows.' }
  }

  const header = rows[0].map((cell) => normalizeCsvCell(cell))
  const headerLower = header.map((cell) => cell.toLowerCase())
  const idIdx = headerLower.findIndex((cell) => cell.includes('student id') || cell === 'id')
  const nameIdx = headerLower.findIndex(
    (cell) => cell.includes('student name') || cell === 'name' || cell === 'student',
  )

  if (nameIdx < 0) {
    return { ok: false, error: 'Not a legacy Student ID / Student Name sheet.' }
  }

  const markStartIdx = Math.max(idIdx, nameIdx) + 1
  const markHeaders = header.slice(markStartIdx).filter(Boolean)
  if (markHeaders.length === 0) {
    return { ok: false, error: 'No mark columns found after Student ID and Student Name.' }
  }

  const today = new Date().toISOString().slice(0, 10)
  const columns: SpreadsheetColumnDraft[] = markHeaders.map((subject) => ({
    subject,
    maxMarks: 50,
    conductedOn: today,
  }))

  const marksByStudentName = new Map<string, string[]>()
  for (const row of rows.slice(1)) {
    if (!row.some((cell) => normalizeCsvCell(cell))) continue
    const name = normalizeCsvCell(row[nameIdx] ?? '')
    if (!name) continue
    marksByStudentName.set(
      name,
      row.slice(markStartIdx, markStartIdx + columns.length).map((cell) => normalizeCsvCell(cell)),
    )
  }

  return finalizeParsedUpload(columns, marksByStudentName)
}

/** Auto-detect Prism wide template or legacy Student ID / Name layout. */
export function parseSpreadsheetMarksRows(rows: string[][]): ParsedSpreadsheetUpload {
  const trimmed = rows.filter((row) => row.some((cell) => normalizeCsvCell(cell)))
  if (trimmed.length === 0) {
    return { ok: false, error: 'File is empty.' }
  }

  const wide = tryParseWideFormat(trimmed)
  if (wide.ok) return wide

  const legacy = tryParseLegacyFormat(trimmed)
  if (legacy.ok) return legacy

  return {
    ok: false,
    error:
      'Unsupported layout. Use the Prism template (.csv or .xlsx), or a sheet with columns # and Student (plus subject rows), or Student ID and Student Name.',
  }
}

export async function parseMarksUploadFile(file: File): Promise<ParsedSpreadsheetUpload> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  try {
    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer()
      return parseSpreadsheetMarksRows(readExcelRows(buffer))
    }
    const text = await file.text()
    return parseSpreadsheetMarksRows(parseDelimitedText(text))
  } catch {
    return { ok: false, error: 'Could not read this file. Try .csv, .xlsx, or .xls from the template.' }
  }
}

function buildSpreadsheetTemplateRows(
  students: { id: string; name: string }[],
  columns: SpreadsheetColumnDraft[],
  meta?: { title?: string; batch?: string },
): (string | number)[][] {
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
  return rows
}

export function downloadSpreadsheetTemplateCsv(
  students: { id: string; name: string }[],
  columns: SpreadsheetColumnDraft[],
  filename: string,
  meta?: { title?: string; batch?: string },
): void {
  downloadCsvText(buildSpreadsheetTemplateCsv(students, columns, meta), filename)
}

export function downloadSpreadsheetTemplateXlsx(
  students: { id: string; name: string }[],
  columns: SpreadsheetColumnDraft[],
  filename: string,
  meta?: { title?: string; batch?: string },
): void {
  const rows = buildSpreadsheetTemplateRows(students, columns, meta)
  writeSpreadsheetWorkbook([{ title: 'Marks', rows }], filename)
}

function safeSheetTitle(title: string, used: Set<string>): string {
  const base = title.replace(/[[\]*?:/\\]/g, '').trim().slice(0, 28) || 'Marks'
  let name = base
  let n = 2
  while (used.has(name)) {
    const suffix = ` ${n}`
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`
    n += 1
  }
  used.add(name)
  return name
}

function sessionToSheetRows(session: {
  assessmentTitle: string
  batch: string
  entries: Array<{
    studentId: string
    studentName: string
    subject: string
    conductedOn: string
    maxMarks: number
    scoredMarks: number
  }>
}): (string | number)[][] {
  const studentMap = new Map<string, string>()
  for (const entry of session.entries) {
    studentMap.set(entry.studentId, entry.studentName)
  }
  const students = [...studentMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const columnKey = (entry: (typeof session.entries)[number]) =>
    `${entry.subject}\0${entry.conductedOn}\0${entry.maxMarks}`

  const columnByKey = new Map<
    string,
    { subject: string; conductedOn: string; maxMarks: number }
  >()
  const scores = new Map<string, number>()

  for (const entry of session.entries) {
    const key = columnKey(entry)
    if (!columnByKey.has(key)) {
      columnByKey.set(key, {
        subject: entry.subject,
        conductedOn: entry.conductedOn,
        maxMarks: entry.maxMarks,
      })
    }
    scores.set(`${entry.studentId}\0${key}`, entry.scoredMarks)
  }

  const columns = [...columnByKey.values()].sort(
    (a, b) => a.subject.localeCompare(b.subject) || a.conductedOn.localeCompare(b.conductedOn),
  )

  const rows: (string | number)[][] = []
  rows.push([session.assessmentTitle, session.batch])
  rows.push(['#', 'Student', ...columns.map((c) => c.subject)])
  rows.push(['', '', ...columns.map((c) => `/ ${c.maxMarks}`)])
  rows.push(['', '', ...columns.map((c) => c.conductedOn)])
  students.forEach((student, index) => {
    const line: (string | number)[] = [index + 1, student.name]
    for (const col of columns) {
      const key = `${col.subject}\0${col.conductedOn}\0${col.maxMarks}`
      const scored = scores.get(`${student.id}\0${key}`)
      line.push(scored === undefined ? '' : scored)
    }
    rows.push(line)
  })
  return rows
}

function writeSpreadsheetWorkbook(
  sheets: Array<{ title: string; rows: (string | number)[][] }>,
  filename: string,
): void {
  const workbook = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows)
    const colCount = Math.max(...sheet.rows.map((row) => row.length), 2)
    ws['!cols'] = [{ wch: 5 }, { wch: 24 }, ...Array(Math.max(colCount - 2, 0)).fill({ wch: 16 })]
    XLSX.utils.book_append_sheet(workbook, ws, sheet.title)
  }
  XLSX.writeFile(workbook, filename)
}

/** Export every saved session into one .xlsx file (one sheet per assessment). */
export function exportAllMarksSessionsXlsx(
  sessions: Array<{
    assessmentTitle: string
    batch: string
    entries: Array<{
      studentId: string
      studentName: string
      subject: string
      conductedOn: string
      maxMarks: number
      scoredMarks: number
    }>
  }>,
  filename = 'prism-marks-export.xlsx',
): void {
  if (sessions.length === 0) return
  const used = new Set<string>()
  const sheets = sessions
    .filter((session) => session.entries.length > 0)
    .map((session) => ({
      title: safeSheetTitle(session.assessmentTitle, used),
      rows: sessionToSheetRows(session),
    }))
  if (sheets.length === 0) return
  writeSpreadsheetWorkbook(sheets, filename)
}
