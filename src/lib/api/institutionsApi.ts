import { apiFetch } from '@/lib/apiClient'
import { mapCenter, type ApiCenter } from '@/lib/api/mappers'
import type { CenterAnalytics } from '@/lib/api/analyticsApi'
import type { Institution, InstitutionCenter } from '@/types'

export interface BranchContextResponse {
  organization: {
    id: string
    name: string
    code?: string | null
    type: string
    boardIds: string[]
  }
  role?: string
  isOwner: boolean
  isPlatformSuperUser?: boolean
  canSelectAllBranches: boolean
  accessibleCenters: ApiCenter[]
  studentCenterId?: string | null
}

export interface OrgAdminUser {
  id: string
  name: string
  email: string
  isOwner: boolean
  active: boolean
  centerIds: string[]
  roles: string[]
}

export async function fetchBranchContext(): Promise<{
  organization: Institution
  role?: string
  isOwner: boolean
  isPlatformSuperUser: boolean
  canSelectAllBranches: boolean
  accessibleCenters: InstitutionCenter[]
  studentCenterId?: string | null
}> {
  const data = await apiFetch<BranchContextResponse>('/auth/branch-context')
  return {
    organization: {
      id: data.organization.id,
      name: data.organization.name,
      code: data.organization.code ?? undefined,
      type: data.organization.type as Institution['type'],
      boardIds: data.organization.boardIds,
      studentCount: 0,
      tutorCount: 0,
    },
    role: data.role,
    isOwner: data.isOwner,
    isPlatformSuperUser: data.isPlatformSuperUser ?? false,
    canSelectAllBranches: data.canSelectAllBranches,
    accessibleCenters: data.accessibleCenters.map(mapCenter),
    studentCenterId: data.studentCenterId,
  }
}

export async function fetchAdmins(): Promise<OrgAdminUser[]> {
  return apiFetch<OrgAdminUser[]>('/admins')
}

export async function createAdmin(body: {
  name: string
  phone: string
  password?: string
  centerIds?: string[]
  isOwner?: boolean
  alsoTutor?: boolean
}): Promise<OrgAdminUser> {
  return apiFetch<OrgAdminUser>('/admins', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function setAdminBranches(adminId: string, centerIds: string[]): Promise<OrgAdminUser> {
  return apiFetch<OrgAdminUser>(`/admins/${adminId}/branches`, {
    method: 'PUT',
    body: JSON.stringify({ centerIds }),
  })
}

export async function fetchOrganization(): Promise<Institution> {
  const data = await apiFetch<{
    id: string
    name: string
    code: string
    type: string
    boardIds: string[]
  }>('/institution')
  return {
    id: data.id,
    name: data.name,
    type: data.type as Institution['type'],
    boardIds: data.boardIds,
    studentCount: 0,
    tutorCount: 0,
  }
}

export async function updateOrganization(patch: { name?: string; type?: string }): Promise<Institution> {
  const data = await apiFetch<{
    id: string
    name: string
    code: string
    type: string
    boardIds: string[]
  }>('/institution', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return {
    id: data.id,
    name: data.name,
    type: data.type as Institution['type'],
    boardIds: data.boardIds,
    studentCount: 0,
    tutorCount: 0,
  }
}

export async function fetchInstitution(code: string): Promise<Institution> {
  const data = await apiFetch<{
    id: string
    name: string
    code: string
    type: string
    boardIds: string[]
  }>(`/institutions/${code}`, { auth: false })
  return {
    id: data.id,
    name: data.name,
    type: data.type as Institution['type'],
    boardIds: data.boardIds,
    studentCount: 0,
    tutorCount: 0,
  }
}

export async function fetchCenters(): Promise<InstitutionCenter[]> {
  const data = await apiFetch<ApiCenter[]>('/centers')
  return data.map(mapCenter)
}

/** Centers with live analytics (student counts, avg health). */
export async function fetchCentersAnalytics(): Promise<CenterAnalytics[]> {
  return apiFetch<CenterAnalytics[]>('/analytics/institution/centers')
}

export async function createCenter(name: string, city: string): Promise<InstitutionCenter> {
  const data = await apiFetch<ApiCenter>('/centers', {
    method: 'POST',
    body: JSON.stringify({ name, city }),
  })
  return mapCenter(data)
}

export async function fetchCenter(centerId: string): Promise<InstitutionCenter> {
  const data = await apiFetch<ApiCenter>(`/centers/${centerId}`)
  return mapCenter(data)
}

export async function updateCenter(
  centerId: string,
  patch: { name?: string; city?: string; active?: boolean },
): Promise<InstitutionCenter> {
  const data = await apiFetch<ApiCenter>(`/centers/${centerId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return mapCenter(data)
}
