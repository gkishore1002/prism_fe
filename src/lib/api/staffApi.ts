import { apiFetch } from '@/lib/apiClient'
import { DEFAULT_PAGE_LIMIT } from '@/lib/pagination'

export interface StaffMember {
  id: string
  name: string
  email: string
  isOwner: boolean
  active: boolean
  centerIds: string[]
  roles: string[]
  assignmentId?: string | null
  assignmentCenterId?: string | null
  assignmentStatus?: string | null
  assignmentStartDate?: string | null
  assignmentEndDate?: string | null
  academicYearId?: string | null
}

export interface StaffAssignment {
  id: string
  staffId: string
  academicYearId: string
  academicYearName: string
  centerId: string
  status: string
  startDate: string
  endDate: string | null
}

export interface PaginatedStaff {
  items: StaffMember[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface StaffListQuery {
  centerId?: string
  academicYearId?: string
  search?: string
  page?: number
  limit?: number
}

export async function fetchStaffPaginated(query: StaffListQuery = {}): Promise<PaginatedStaff> {
  const params = new URLSearchParams()
  if (query.centerId) params.set('center_id', query.centerId)
  if (query.academicYearId) params.set('academic_year_id', query.academicYearId)
  if (query.search) params.set('search', query.search)
  params.set('page', String(query.page ?? 1))
  params.set('limit', String(query.limit ?? DEFAULT_PAGE_LIMIT))
  return apiFetch<PaginatedStaff>(`/staff?${params.toString()}`)
}

/** @deprecated Prefer fetchStaffPaginated — kept for callers that need a flat list. */
export async function fetchStaff(
  centerId?: string,
  academicYearId?: string,
): Promise<StaffMember[]> {
  const data = await fetchStaffPaginated({
    centerId,
    academicYearId,
    page: 1,
    limit: 100,
  })
  return data.items
}

export async function createStaff(body: {
  name: string
  phone: string
  password?: string
  isOwner?: boolean
  isBranchAdmin?: boolean
  isTutor?: boolean
  centerIds?: string[]
  academicYearId?: string
  assignmentCenterId?: string
}): Promise<StaffMember> {
  return apiFetch<StaffMember>('/staff', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateStaff(
  staffId: string,
  body: Partial<{
    name: string
    email: string
    isOwner: boolean
    isBranchAdmin: boolean
    isTutor: boolean
    centerIds: string[]
  }>,
): Promise<StaffMember> {
  return apiFetch<StaffMember>(`/staff/${encodeURIComponent(staffId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function setStaffBranches(staffId: string, centerIds: string[]): Promise<StaffMember> {
  return apiFetch<StaffMember>(`/staff/${encodeURIComponent(staffId)}/branches`, {
    method: 'PUT',
    body: JSON.stringify({ centerIds }),
  })
}

export async function listStaffAssignments(staffId: string): Promise<StaffAssignment[]> {
  return apiFetch<StaffAssignment[]>(
    `/staff/${encodeURIComponent(staffId)}/assignments`,
  )
}

export async function upsertStaffAssignment(
  staffId: string,
  academicYearId: string,
  body: {
    centerId: string
    status?: string
    startDate?: string
    endDate?: string | null
  },
): Promise<StaffAssignment> {
  return apiFetch<StaffAssignment>(
    `/staff/${encodeURIComponent(staffId)}/assignments/${encodeURIComponent(academicYearId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  )
}
