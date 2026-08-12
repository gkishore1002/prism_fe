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

export function studentRowsFromCsv(rows: Record<string, string>[]) {
  return rows
    .filter((row) => Object.values(row).some((value) => value.trim()))
    .map((row) => ({
      name: row.name ?? '',
      phone: row.phone ?? '',
      board: row.board ?? '',
      grade: row.grade ?? '',
      batch: row.batch ?? '',
      centerName: row.center ?? row.center_name ?? '',
      centerId: row.center_id ?? '',
      academicYear: row.academic_year ?? '2025-26',
      password: row.password || undefined,
      schoolName: row.school_name || undefined,
    }))
}

export function staffRowsFromCsv(rows: Record<string, string>[]) {
  return rows
    .filter((row) => Object.values(row).some((value) => value.trim()))
    .map((row) => ({
      name: row.name ?? '',
      phone: row.phone ?? '',
      isOwner: parseTruthy(row.org_owner),
      isBranchAdmin: parseTruthy(row.branch_admin),
      isTutor: parseTruthy(row.tutor),
      centerNames: splitList(row.branches ?? row.centers ?? row.branch),
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
