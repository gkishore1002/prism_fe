import { apiFetch } from '@/lib/apiClient'

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

export async function fetchStaff(
  centerId?: string,
  academicYearId?: string,
): Promise<StaffMember[]> {
  const params = new URLSearchParams()
  if (centerId) params.set('center_id', centerId)
  if (academicYearId) params.set('academic_year_id', academicYearId)
  const qs = params.toString()
  return apiFetch<StaffMember[]>(`/staff${qs ? `?${qs}` : ''}`)
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
