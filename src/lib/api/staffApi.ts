import { apiFetch } from '@/lib/apiClient'

export interface StaffMember {
  id: string
  name: string
  email: string
  isOwner: boolean
  active: boolean
  centerIds: string[]
  roles: string[]
}

export async function fetchStaff(centerId?: string): Promise<StaffMember[]> {
  return apiFetch<StaffMember[]>(
    `/staff${centerId ? `?center_id=${encodeURIComponent(centerId)}` : ''}`,
  )
}

export async function createStaff(body: {
  name: string
  phone: string
  password?: string
  isOwner?: boolean
  isBranchAdmin?: boolean
  isTutor?: boolean
  centerIds?: string[]
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
