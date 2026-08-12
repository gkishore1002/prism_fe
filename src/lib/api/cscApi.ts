import { apiFetch } from '@/lib/apiClient'
import type { ReportCollectionLog, StudentTracking } from '@/types'

export async function fetchReportCollections(studentId: string): Promise<ReportCollectionLog[]> {
  return apiFetch<ReportCollectionLog[]>(`/students/${encodeURIComponent(studentId)}/report-collections`)
}

export async function fetchStudentTracking(studentId: string): Promise<StudentTracking> {
  return apiFetch<StudentTracking>(`/students/${encodeURIComponent(studentId)}/tracking`)
}

export async function logReportCollection(
  studentId: string,
  body: {
    reportKind: 'assessment' | 'overall' | 'monthly'
    reportRef?: string
    collectedAt?: string
    guardianName?: string
    notes?: string
  },
): Promise<ReportCollectionLog> {
  return apiFetch<ReportCollectionLog>(`/students/${encodeURIComponent(studentId)}/report-collections`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
