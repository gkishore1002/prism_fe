import { apiFetch } from '@/lib/apiClient'
import type { StudentMasterProfile, StudentSummary } from '@/types'
import { DEFAULT_PAGE_LIMIT } from '@/lib/pagination'
import { mapStudent, type ApiStudentSummary } from '@/lib/api/mappers'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface StudentMasterStats {
  total: number
  active: number
  inactive: number
}

export interface StudentMasterQuery {
  page?: number
  limit?: number
  search?: string
  center?: string
  status?: 'active' | 'inactive'
  board?: string
  grade?: string
  batch?: string
  academicYearId?: string
}

export interface StudentSummaryQuery {
  page?: number
  limit?: number
  search?: string
  center?: string
  board?: string
  grade?: string
  batch?: string
  academicYearId?: string
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

function mapMasterRow(row: StudentMasterProfile): StudentMasterProfile {
  return {
    id: row.id,
    name: row.name,
    board: row.board,
    grade: row.grade,
    batch: row.batch,
    batchIds: row.batchIds ?? [],
    centerId: row.centerId,
    academicYear: row.academicYear,
    schoolName: row.schoolName ?? undefined,
    email: row.email ?? undefined,
    status: row.status,
    lastCscInteractionAt: row.lastCscInteractionAt ?? undefined,
    disableReason: row.disableReason ?? undefined,
    daysUntilCscDisable: row.daysUntilCscDisable ?? undefined,
  }
}

export async function fetchStudentsMasterPaginated(
  query: StudentMasterQuery = {},
): Promise<PaginatedResponse<StudentMasterProfile>> {
  const data = await apiFetch<PaginatedResponse<StudentMasterProfile>>(
    `/students/master${buildQuery({
      page: query.page ?? 1,
      limit: query.limit ?? DEFAULT_PAGE_LIMIT,
      search: query.search,
      center: query.center,
      status: query.status,
      board: query.board,
      grade: query.grade,
      batch: query.batch,
      academic_year_id: query.academicYearId,
    })}`,
  )
  return { ...data, items: data.items.map(mapMasterRow) }
}

export async function fetchStudentMaster(studentId: string): Promise<StudentMasterProfile> {
  const row = await apiFetch<StudentMasterProfile>(`/students/${encodeURIComponent(studentId)}`)
  return mapMasterRow(row)
}

export async function fetchStudentsMasterStats(
  center?: string,
  academicYearId?: string,
): Promise<StudentMasterStats> {
  return apiFetch<StudentMasterStats>(
    `/students/master/stats${buildQuery({ center, academic_year_id: academicYearId })}`,
  )
}

export async function fetchStudentsPaginated(
  query: StudentSummaryQuery = {},
): Promise<PaginatedResponse<StudentSummary>> {
  const data = await apiFetch<PaginatedResponse<ApiStudentSummary>>(
    `/students${buildQuery({
      page: query.page ?? 1,
      limit: query.limit ?? DEFAULT_PAGE_LIMIT,
      search: query.search,
      center: query.center,
      board: query.board,
      grade: query.grade,
      batch: query.batch,
      academic_year_id: query.academicYearId,
    })}`,
  )
  return { ...data, items: data.items.map(mapStudent) }
}
