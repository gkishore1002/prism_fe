import { apiFetch, ApiError } from '@/lib/apiClient'
import { readSession } from '@/modules/auth/lib/authStorage'
import type { User, UserRole } from '@/types'

export interface RoleOption {
  role: UserRole
  label: string
  description: string
  adminPortal?: 'organization' | 'branch'
}

export function roleOptionKey(option: Pick<RoleOption, 'role' | 'adminPortal'>): string {
  return `${option.role}-${option.adminPortal ?? 'default'}`
}

export interface RoleOptionsResponse {
  roles: RoleOption[]
  currentRole: UserRole
  currentAdminPortal?: 'organization' | 'branch'
}

export interface LoginSuccess {
  type: 'authenticated'
  email: string
  role: UserRole
  user: User
  accessToken?: string
  adminPortal?: 'organization' | 'branch'
}

export interface LoginPendingRoles {
  type: 'role_selection'
  email: string
  roles: RoleOption[]
  institutionCode?: string
}

export type LoginResult = LoginSuccess | LoginPendingRoles

interface ApiUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string | null
  institutionId: string
  gradeId?: string | null
  boardId?: string | null
  isOwner?: boolean
  adminPortal?: 'organization' | 'branch'
}

interface ApiLoginAuthenticated {
  type: 'authenticated'
  email: string
  role: UserRole
  user: ApiUser
  accessToken: string
  adminPortal?: 'organization' | 'branch'
}

interface ApiLoginRoleSelection {
  type: 'role_selection'
  email: string
  roles: RoleOption[]
  institutionCode?: string
}

function mapApiUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? undefined,
    institutionId: user.institutionId,
    gradeId: user.gradeId ?? undefined,
    boardId: user.boardId ?? undefined,
    isOwner: user.isOwner ?? false,
  }
}

export interface LoginOrganization {
  id: string
  name: string
  code: string
}

export async function fetchLoginOrganizations(): Promise<LoginOrganization[]> {
  const data = await apiFetch<LoginOrganization[] | { organizations?: LoginOrganization[] }>(
    '/auth/organizations',
    { auth: false },
  )
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.organizations)) return data.organizations
  return []
}

export async function loginPrism(
  email: string,
  password: string,
  institutionCode: string,
): Promise<LoginResult> {
  const result = await apiFetch<ApiLoginAuthenticated | ApiLoginRoleSelection>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password, institutionCode }),
  })

  if (result.type === 'role_selection') {
    return {
      type: 'role_selection',
      email: result.email,
      roles: result.roles,
      institutionCode: result.institutionCode,
    }
  }

  return {
    type: 'authenticated',
    email: result.email,
    role: result.role,
    user: mapApiUser(result.user),
    accessToken: result.accessToken,
    adminPortal: result.adminPortal ?? result.user.adminPortal,
  }
}

export async function selectRolePrism(
  email: string,
  role: UserRole,
  options?: { institutionCode?: string; adminPortal?: 'organization' | 'branch' },
): Promise<LoginSuccess> {
  const result = await apiFetch<ApiLoginAuthenticated>('/auth/select-role', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      email,
      role,
      institutionCode: options?.institutionCode,
      adminPortal: options?.adminPortal,
    }),
  })
  return {
    type: 'authenticated',
    email: result.email,
    role: result.role,
    user: mapApiUser(result.user),
    accessToken: result.accessToken,
    adminPortal: result.adminPortal ?? result.user.adminPortal,
  }
}

export interface AuthSessionSync {
  user: User
  adminPortal?: 'organization' | 'branch'
}

export async function fetchAuthSession(): Promise<AuthSessionSync | null> {
  const session = readSession()
  if (!session?.accessToken) return null
  try {
    const user = await apiFetch<ApiUser>('/auth/me')
    return {
      user: mapApiUser(user),
      adminPortal: user.adminPortal,
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    return null
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const synced = await fetchAuthSession()
  return synced?.user ?? null
}

export async function logoutPrism(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } catch {
    // stateless JWT — ignore network errors on logout
  }
}

export async function fetchRoleOptions(): Promise<RoleOptionsResponse> {
  return apiFetch<RoleOptionsResponse>('/auth/role-options')
}

export async function switchRolePrism(option: RoleOption): Promise<LoginSuccess> {
  const result = await apiFetch<ApiLoginAuthenticated>('/auth/switch-role', {
    method: 'POST',
    body: JSON.stringify({
      role: option.role,
      adminPortal: option.adminPortal,
    }),
  })
  return {
    type: 'authenticated',
    email: result.email,
    role: result.role,
    user: mapApiUser(result.user),
    accessToken: result.accessToken,
    adminPortal: result.adminPortal ?? result.user.adminPortal,
  }
}
