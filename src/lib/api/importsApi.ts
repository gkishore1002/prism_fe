import { apiFetch } from '@/lib/apiClient'
import { downloadCsvExport } from '@/lib/api/exportsApi'

export interface BulkImportRowResult {
  row: number
  name: string
  success: boolean
  id?: string
  error?: string
}

export interface BulkImportResult {
  created: number
  failed: number
  results: BulkImportRowResult[]
}

export interface StudentBulkRowPayload {
  name: string
  phone: string
  board: string
  grade: string
  batch?: string
  centerId?: string
  centerName?: string
  academicYear?: string
  password?: string
  schoolName?: string
}

export interface StaffBulkRowPayload {
  name: string
  phone: string
  password?: string
  isOwner?: boolean
  isBranchAdmin?: boolean
  isTutor?: boolean
  centerIds?: string[]
  centerNames?: string[]
}

export function downloadStudentsImportTemplate() {
  return downloadCsvExport('/imports/students-template.csv', 'students-import-template.csv')
}

export function downloadStaffImportTemplate() {
  return downloadCsvExport('/imports/staff-template.csv', 'staff-import-template.csv')
}

export async function bulkImportStudents(rows: StudentBulkRowPayload[]): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/imports/students', {
    method: 'POST',
    body: JSON.stringify({
      rows: rows.map((row) => ({
        name: row.name,
        phone: row.phone,
        board: row.board,
        grade: row.grade,
        batch: row.batch ?? '',
        centerId: row.centerId ?? '',
        centerName: row.centerName ?? '',
        academicYear: row.academicYear ?? '2025-26',
        password: row.password,
        schoolName: row.schoolName,
      })),
    }),
  })
}

export async function bulkImportStaff(rows: StaffBulkRowPayload[]): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/imports/staff', {
    method: 'POST',
    body: JSON.stringify({
      rows: rows.map((row) => ({
        name: row.name,
        phone: row.phone,
        password: row.password,
        isOwner: row.isOwner ?? false,
        isBranchAdmin: row.isBranchAdmin ?? false,
        isTutor: row.isTutor ?? false,
        centerIds: row.centerIds ?? [],
        centerNames: row.centerNames ?? [],
      })),
    }),
  })
}
