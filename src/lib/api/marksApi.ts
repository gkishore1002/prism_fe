import { getApiBaseUrl, isApiEnabled } from '@/lib/apiClient'
import { readSession } from '@/modules/auth/lib/authStorage'
import { apiFetch } from '@/lib/apiClient'
import type { MarksRecord, MarksSource } from '@/modules/tutor/lib/marksStorage'

export interface ApiMarksColumn {
  id: string
  subject: string
  conductedOn: string
  maxMarks: number
}

export interface MarksBulkSavePayload {
  batchId: string
  assessmentTitle: string
  description?: string
  source: MarksSource
  columns: ApiMarksColumn[]
  marks: Record<string, Record<string, string>>
  studentIds: string[]
}

export interface MarksActivitySessionApi {
  sessionId: string
  assessmentTitle: string
  description?: string
  batch: string
  savedAt: string
  source: MarksSource
  entries: MarksRecord[]
}

export async function fetchMarksSessions(batchId?: string): Promise<MarksActivitySessionApi[]> {
  const qs = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : ''
  return apiFetch<MarksActivitySessionApi[]>(`/marks/sessions${qs}`)
}

export async function saveMarksBulk(payload: MarksBulkSavePayload): Promise<{
  sessionId: string
  savedAt: string
  count: number
}> {
  return apiFetch('/marks/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function downloadMarksExport(options?: {
  batchId?: string
  sessionId?: string
  filename?: string
  format?: 'xlsx' | 'csv'
}): Promise<void> {
  if (!isApiEnabled()) return
  const params = new URLSearchParams()
  if (options?.batchId) params.set('batch_id', options.batchId)
  if (options?.sessionId) params.set('session_id', options.sessionId)
  params.set('format', options?.format ?? 'xlsx')
  const token = readSession()?.accessToken
  const res = await fetch(`${getApiBaseUrl()}/marks/export?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error('Failed to export marks.')
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const defaultName = (options?.format ?? 'xlsx') === 'xlsx' ? 'prism-marks-export.xlsx' : 'prism-marks-export.csv'
  const filename = options?.filename ?? match?.[1] ?? defaultName
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function marksApiAvailable(): boolean {
  return isApiEnabled()
}
