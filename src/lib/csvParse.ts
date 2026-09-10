export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

/** Minimal RFC4180-style CSV parser for bulk import templates. */
export function parseCsvText(text: string): ParsedCsv {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const cleaned = rows.filter((cells) => cells.some((cell) => cell.trim().length > 0))
  if (cleaned.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = cleaned[0].map(normalizeHeader)
  const dataRows = cleaned.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? '').trim()
    })
    return record
  })

  return { headers, rows: dataRows }
}

export function parseTruthy(value: string | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  return normalized === 'yes' || normalized === 'y' || normalized === 'true' || normalized === '1' || normalized === 'x'
}

export function splitList(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(/[;,|]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function recordsFromMatrix(matrix: unknown[][]): ParsedCsv {
  const cleaned = matrix
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    .filter((cells) => cells.some((cell) => cell.length > 0))
  if (cleaned.length === 0) {
    return { headers: [], rows: [] }
  }
  const headers = cleaned[0].map(normalizeHeader)
  const dataRows = cleaned.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (!header) return
      record[header] = (cells[index] ?? '').trim()
    })
    return record
  })
  return { headers, rows: dataRows }
}

/** Read .csv / .xlsx / .xls into normalized header records for bulk import. */
export async function parseSpreadsheetFile(file: File): Promise<ParsedCsv> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return { headers: [], rows: [] }
    }
    const sheet = workbook.Sheets[sheetName]
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    })
    return recordsFromMatrix(matrix)
  }

  if (ext && ext !== 'csv' && ext !== 'txt' && ext !== 'tsv') {
    throw new Error('Unsupported file. Use .csv, .xlsx, or .xls.')
  }

  const text = await file.text()
  // Excel-saved "CSV" sometimes uses tabs / semicolons.
  if (ext === 'tsv' || (text.includes('\t') && !text.includes(','))) {
    const matrix = text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.split('\t'))
    return recordsFromMatrix(matrix)
  }
  return parseCsvText(text)
}

function pickRowValue(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value?.trim()) return value.trim()
  }
  return ''
}

export function studentRowsFromCsv(rows: Record<string, string>[]) {
  return rows
    .filter((row) => Object.values(row).some((value) => value.trim()))
    .map((row) => ({
      name: pickRowValue(row, ['name', 'student_name', 'student', 'full_name']),
      phone: pickRowValue(row, ['phone', 'mobile', 'phone_number', 'mobile_number']),
      board: pickRowValue(row, ['board']),
      grade: pickRowValue(row, ['grade', 'class']),
      batch: pickRowValue(row, ['batch', 'batch_name']),
      centerName: pickRowValue(row, ['center', 'center_name', 'branch', 'branch_name']),
      centerId: pickRowValue(row, ['center_id', 'branch_id']),
      academicYear: pickRowValue(row, ['academic_year', 'year']) || '2025-26',
      password: pickRowValue(row, ['password']) || undefined,
      schoolName: pickRowValue(row, ['school_name', 'school']) || undefined,
    }))
}

export function staffRowsFromCsv(rows: Record<string, string>[]) {
  return rows
    .filter((row) => Object.values(row).some((value) => value.trim()))
    .map((row) => ({
      name: pickRowValue(row, ['name', 'staff_name', 'full_name']),
      phone: pickRowValue(row, ['phone', 'mobile', 'phone_number', 'mobile_number']),
      isOwner: parseTruthy(row.org_owner),
      isBranchAdmin: parseTruthy(row.branch_admin),
      isTutor: parseTruthy(row.tutor),
      centerNames: splitList(row.branches ?? row.centers ?? row.branch ?? row.center),
      password: row.password || undefined,
    }))
}

export function downloadCsv(filename: string, headers: string[], sampleRows: string[][]) {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }
  const lines = [
    headers.join(','),
    ...sampleRows.map((row) => row.map(escape).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
