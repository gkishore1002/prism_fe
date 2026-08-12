import { readSession } from '@/modules/auth/lib/authStorage'
import { getApiBaseUrl } from '@/lib/apiClient'

export async function downloadCsvExport(path: string, filename: string): Promise<void> {
  const token = readSession()?.accessToken
  const base = getApiBaseUrl()
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Export failed (${res.status})`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportStudentsCsv(centerId?: string) {
  const qs = centerId ? `?center_id=${encodeURIComponent(centerId)}` : ''
  return downloadCsvExport(`/exports/students.csv${qs}`, 'students.csv')
}

export function exportCscComplianceCsv(centerId?: string) {
  const qs = centerId ? `?center_id=${encodeURIComponent(centerId)}` : ''
  return downloadCsvExport(`/exports/csc-compliance.csv${qs}`, 'csc-compliance.csv')
}

export function exportReassignmentCsv() {
  return downloadCsvExport('/exports/reassignment-requests.csv', 'reassignment-requests.csv')
}

export function exportCentersCsv() {
  return downloadCsvExport('/exports/centers.csv', 'centers.csv')
}
