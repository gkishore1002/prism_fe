import type { User, UserRole } from '@/types'
import type { ModuleId } from '@/lib/modules'
import {
  adminPortalLabel,
  isBranchScopedAdminPortal,
  isOrganizationOwner,
  isPlatformSuperUser,
} from '@/lib/roles'

export interface RoleProfile {
  name: string
  roleLabel: string
  subtitle: string
  initials: string
}

export function getSidebarProfile(
  moduleId: ModuleId,
  authUser: User,
  options?: {
    subtitle?: string
    isPlatformSuperUserInContext?: boolean
    adminPortal?: 'organization' | 'branch'
    canManageTenant?: boolean
  },
): RoleProfile {
  const parts = authUser.name.trim().split(/\s+/)
  const initials = parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (moduleId === 'student') {
    return {
      name: authUser.name,
      roleLabel: 'Student',
      subtitle: options?.subtitle ?? 'Student portal',
      initials,
    }
  }

  if (moduleId === 'tutor') {
    return {
      name: authUser.name,
      roleLabel: 'Tutor',
      subtitle: options?.subtitle ?? 'Tutor portal',
      initials,
    }
  }

  const platformContext = options?.isPlatformSuperUserInContext ?? isPlatformSuperUser(authUser.role)
  const branchScoped = isBranchScopedAdminPortal(
    options?.adminPortal,
    authUser.role,
    options?.canManageTenant ?? Boolean(authUser.isOwner),
  )

  if (platformContext && isPlatformSuperUser(authUser.role)) {
    return {
      name: authUser.name,
      roleLabel: 'Platform Super User',
      subtitle: options?.subtitle ?? 'Platform console',
      initials,
    }
  }

  if (moduleId === 'admin' && authUser.role === 'admin') {
    const roleLabel = adminPortalLabel(
      options?.adminPortal,
      authUser.role,
      options?.canManageTenant ?? Boolean(authUser.isOwner),
    )
    return {
      name: authUser.name,
      roleLabel,
      subtitle:
        options?.subtitle ??
        (branchScoped ? 'Assigned branch operations' : 'Organization-wide administration'),
      initials,
    }
  }

  if (isOrganizationOwner(authUser.role, Boolean(authUser.isOwner))) {
    return {
      name: authUser.name,
      roleLabel: 'Organization Owner',
      subtitle: options?.subtitle ?? 'Organization owner',
      initials,
    }
  }

  return {
    name: authUser.name,
    roleLabel: adminPortalLabel(options?.adminPortal, authUser.role, false),
    subtitle: options?.subtitle ?? 'Branch admin',
    initials,
  }
}

export function roleLabelFor(role: UserRole, isOwner = false): string {
  if (isOrganizationOwner(role, isOwner)) return 'Organization Owner'
  if (role === 'admin') return 'Branch Admin'
  if (role === 'tutor') return 'Tutor'
  if (isPlatformSuperUser(role)) return 'Platform Super User'
  return 'Student'
}
