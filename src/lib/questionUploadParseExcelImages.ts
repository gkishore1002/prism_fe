/**
 * Parse .xlsx with ExcelJS — maps floating / cell-anchored images to
 * Question Text / Option A–D columns by row+col anchor.
 *
 * Preferred authoring: Insert → Pictures → Place in Cell on those columns.
 * Floating "Place over Cells" images are best-effort via anchor mapping.
 */
import ExcelJS from 'exceljs'
import type { QuestionUploadRow } from '@/types'
import {
  isQuestionUploadFileName,
  parseQuestionUploadFile,
  validateQuestionUploadRow,
} from '@/lib/questionUploadParse'

type ImageField =
  | 'textImageBlob'
  | 'optionAImageBlob'
  | 'optionBImageBlob'
  | 'optionCImageBlob'
  | 'optionDImageBlob'

const IMAGE_FIELDS_BY_HEADER: Record<string, ImageField> = {
  questiontext: 'textImageBlob',
  question: 'textImageBlob',
  text: 'textImageBlob',
  prompt: 'textImageBlob',
  optiona: 'optionAImageBlob',
  a: 'optionAImageBlob',
  choicea: 'optionAImageBlob',
  optionb: 'optionBImageBlob',
  b: 'optionBImageBlob',
  choiceb: 'optionBImageBlob',
  optionc: 'optionCImageBlob',
  c: 'optionCImageBlob',
  choicec: 'optionCImageBlob',
  optiond: 'optionDImageBlob',
  d: 'optionDImageBlob',
  choiced: 'optionDImageBlob',
}

function cellHeaderText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const v = value as { text?: string; richText?: { text?: string }[]; result?: unknown }
    if (typeof v.text === 'string') return v.text
    if (Array.isArray(v.richText)) return v.richText.map((p) => p.text ?? '').join('')
    if (v.result != null) return String(v.result)
  }
  return String(value)
}

function normalizeHeader(value: unknown): string {
  return cellHeaderText(value)
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9]+/g, '')
}

function bufferToBlob(buffer: ExcelJS.Buffer, extension?: string): Blob {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer)
  const mime =
    extension === 'png'
      ? 'image/png'
      : extension === 'gif'
        ? 'image/gif'
        : 'image/jpeg'
  return new Blob([bytes], { type: mime })
}

function anchorRowCol(img: ExcelJS.Image): { row0: number; col0: number } | null {
  const range = img.range as {
    tl?: { nativeRow?: number; nativeCol?: number; row?: number; col?: number }
  }
  const tl = range?.tl
  if (!tl) return null
  if (typeof tl.nativeRow === 'number' && typeof tl.nativeCol === 'number') {
    return { row0: tl.nativeRow, col0: tl.nativeCol }
  }
  if (typeof tl.row === 'number' && typeof tl.col === 'number') {
    return { row0: Math.floor(tl.row), col0: Math.floor(tl.col) }
  }
  return null
}

export type ExcelImageParseMeta = {
  imageCount: number
  mappedCount: number
  warnings: string[]
}

export async function parseQuestionUploadExcelWithImages(
  file: File,
): Promise<{ rows: QuestionUploadRow[]; meta: ExcelImageParseMeta; suggestedName?: string }> {
  const warnings: string[] = []
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  if (!sheet) {
    throw new Error('Workbook has no sheets')
  }

  const headerRow = sheet.getRow(1)
  const colToField = new Map<number, ImageField>()
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeHeader(cell.value)
    const field = IMAGE_FIELDS_BY_HEADER[key]
    if (field) colToField.set(colNumber, field)
  })

  const textResult = await parseQuestionUploadFile(file)
  if (!textResult.ok) {
    throw new Error(textResult.error)
  }

  const rows = textResult.rows.map((r) => ({ ...r }))
  let imageCount = 0
  let mappedCount = 0

  const images = typeof sheet.getImages === 'function' ? sheet.getImages() : []
  for (const img of images) {
    imageCount += 1
    const imageId = Number(img.imageId)
    const media = workbook.getImage(imageId)
    if (!media?.buffer) {
      warnings.push(`Skipped an image that could not be read (id ${img.imageId}).`)
      continue
    }
    const anchor = anchorRowCol(img as ExcelJS.Image)
    if (!anchor) {
      warnings.push('An image has no cell anchor and was skipped.')
      continue
    }
    const applied = applyImage(rows, anchor.row0, anchor.col0 + 1, media, colToField, warnings)
    if (applied) mappedCount += 1
  }

  if (imageCount === 0) {
    warnings.push(
      'No embedded sheet images found. In Excel use Insert → Pictures → Place in Cell on Question Text / Option columns (not Place over Cells). Save as .xlsx.',
    )
  } else if (mappedCount === 0) {
    warnings.push(
      'Images were found but not linked to Question Text / Option A–D. Put each image in the matching cell on that question’s row.',
    )
  }

  const validated = rows.map((row) => {
    const { valid: _v, errors: _e, ...rest } = row
    return validateQuestionUploadRow(rest)
  })

  return {
    rows: validated,
    suggestedName: textResult.suggestedName,
    meta: { imageCount, mappedCount, warnings },
  }
}

function applyImage(
  rows: QuestionUploadRow[],
  sheetRowZeroBased: number,
  colNumber: number,
  media: { buffer: ExcelJS.Buffer; extension?: string },
  colToField: Map<number, ImageField>,
  warnings: string[],
): boolean {
  if (sheetRowZeroBased < 1) return false
  const rowIndex = sheetRowZeroBased - 1
  const row = rows[rowIndex]
  if (!row) {
    warnings.push(`Image anchored at row ${sheetRowZeroBased + 1} has no matching question row.`)
    return false
  }
  const field = colToField.get(colNumber)
  if (!field) {
    warnings.push(
      `Image at row ${sheetRowZeroBased + 1}, column ${colNumber} is not on Question Text / Option A–D.`,
    )
    return false
  }
  if (row[field]) {
    warnings.push(`Multiple images on ${field} for row ${row.row}; keeping the first.`)
    return false
  }
  const blob = bufferToBlob(media.buffer, media.extension)
  row[field] = blob
  const previewMap: Record<ImageField, keyof QuestionUploadRow> = {
    textImageBlob: 'textImagePreviewUrl',
    optionAImageBlob: 'optionAImagePreviewUrl',
    optionBImageBlob: 'optionBImagePreviewUrl',
    optionCImageBlob: 'optionCImagePreviewUrl',
    optionDImageBlob: 'optionDImagePreviewUrl',
  }
  ;(row as Record<string, unknown>)[previewMap[field]] = URL.createObjectURL(blob)
  return true
}

export function canParseExcelImages(fileName: string): boolean {
  return /\.xlsx$/i.test(fileName) && isQuestionUploadFileName(fileName)
}
