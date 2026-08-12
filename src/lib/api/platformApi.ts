import { apiFetch } from '@/lib/apiClient'

export interface PlatformOrganization {
  id: string
  name: string
  code: string
  schemaName: string
  type: string
  isActive: boolean
  adminCount: number
}

export interface PlatformOrganizationAdmin {
  id: string
  name: string
  email: string
  isOwner: boolean
}

export interface PlatformOrganizationOwner {
  name: string
  email: string
}

export interface PlatformOrganizationDetail extends PlatformOrganization {
  owner?: PlatformOrganizationOwner | null
  admins: PlatformOrganizationAdmin[]
}

export interface PlatformSuperAdmin {
  id: string
  email: string
  fullName: string
  isActive: boolean
}

export interface PlatformStats {
  totalOrganizations: number
  totalActiveOrganizations: number
  totalSuperAdmins: number
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  return apiFetch<PlatformStats>('/platform/stats')
}

export async function fetchPlatformOrganizations(): Promise<PlatformOrganization[]> {
  return apiFetch<PlatformOrganization[]>('/platform/organizations')
}

export async function fetchPlatformOrganization(code: string): Promise<PlatformOrganizationDetail> {
  return apiFetch<PlatformOrganizationDetail>(`/platform/organizations/${encodeURIComponent(code)}`)
}

export async function createPlatformOrganization(body: {
  organizationName: string
  organizationCode: string
  ownerName: string
  ownerPhone: string
  password?: string
  type?: string
}): Promise<PlatformOrganization> {
  return apiFetch<PlatformOrganization>('/platform/organizations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updatePlatformOrganization(
  code: string,
  patch: { name?: string; type?: string; isActive?: boolean },
): Promise<PlatformOrganization> {
  return apiFetch<PlatformOrganization>(`/platform/organizations/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function fetchPlatformSuperAdmins(): Promise<PlatformSuperAdmin[]> {
  return apiFetch<PlatformSuperAdmin[]>('/platform/super-admins')
}

export async function createPlatformSuperAdmin(body: {
  email: string
  fullName: string
  password: string
}): Promise<PlatformSuperAdmin> {
  return apiFetch<PlatformSuperAdmin>('/platform/super-admins', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
