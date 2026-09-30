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

/** Body for create/update draft (incomplete work allowed). */
export interface MarksDraftPayload {
  batchId?: string | null
  assessmentTitle?: string
  description?: string | null
  source: MarksSource
  columns: ApiMarksColumn[]
  marks: Record<string, Record<string, string>>
  studentIds: string[]
}

export interface MarksDraftPayloadBody {
  columns: ApiMarksColumn[]
  marks: Record<string, Record<string, string>>
  studentIds: string[]
}

/** Server draft row (Gmail-style). Nested payload holds grid data. */
export interface MarksDraftApi {
  id: string
  batchId?: string | null
  batch?: string
  assessmentTitle: string
  description?: string | null
  source: MarksSource
  status: string
  payload: MarksDraftPayloadBody
  createdAt: string
  updatedAt: string
  createdByUserId?: string
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

export async function fetchMarksDrafts(batchId?: string): Promise<MarksDraftApi[]> {
  const qs = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : ''
  return apiFetch<MarksDraftApi[]>(`/marks/drafts${qs}`)
}

export async function fetchMarksDraft(id: string): Promise<MarksDraftApi> {
  return apiFetch<MarksDraftApi>(`/marks/drafts/${encodeURIComponent(id)}`)
}

export async function createMarksDraft(payload: MarksDraftPayload): Promise<MarksDraftApi> {
  return apiFetch<MarksDraftApi>('/marks/drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateMarksDraft(
  id: string,
  payload: MarksDraftPayload,
): Promise<MarksDraftApi> {
  return apiFetch<MarksDraftApi>(`/marks/drafts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function publishMarksDraft(id: string): Promise<{
  sessionId: string
  savedAt: string
  count: number
}> {
  return apiFetch(`/marks/drafts/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  })
}

export async function deleteMarksDraft(id: string): Promise<void> {
  await apiFetch<void>(`/marks/drafts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
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
