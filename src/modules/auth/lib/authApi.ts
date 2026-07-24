import { apiFetch, ApiError } from '@/lib/apiClient'
import { readSession } from '@/modules/auth/lib/authStorage'
import type { User, UserRole } from '@/types'

export interface RoleOption {
  role: UserRole
  label: string
  description: string
}

export interface LoginSuccess {
  type: 'authenticated'
  email: string
  role: UserRole
  user: User
  accessToken?: string
}

export interface LoginPendingRoles {
  type: 'role_selection'
  email: string
  roles: RoleOption[]
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
}

interface ApiLoginAuthenticated {
  type: 'authenticated'
  email: string
  role: UserRole
  user: ApiUser
  accessToken: string
}

interface ApiLoginRoleSelection {
  type: 'role_selection'
  email: string
  roles: RoleOption[]
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
  }
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
    return { type: 'role_selection', email: result.email, roles: result.roles }
  }

  return {
    type: 'authenticated',
    email: result.email,
    role: result.role,
    user: mapApiUser(result.user),
    accessToken: result.accessToken,
  }
}

export async function selectRolePrism(email: string, role: UserRole): Promise<LoginSuccess> {
  const result = await apiFetch<ApiLoginAuthenticated>('/auth/select-role', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, role }),
  })
  return {
    type: 'authenticated',
    email: result.email,
    role: result.role,
    user: mapApiUser(result.user),
    accessToken: result.accessToken,
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const session = readSession()
  if (!session?.accessToken) return null
  try {
    const user = await apiFetch<ApiUser>('/auth/me')
    return mapApiUser(user)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    return null
  }
}

export async function logoutPrism(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } catch {
    // stateless JWT — ignore network errors on logout
  }
}
