import type { User, UserRole } from '@/types'
import type { ModuleId } from '@/lib/modules'

export interface RoleProfile {
  name: string
  roleLabel: string
  subtitle: string
  initials: string
}

export function getSidebarProfile(
  moduleId: ModuleId,
  authUser: User,
  options?: { subtitle?: string },
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

  return {
    name: authUser.name,
    roleLabel: 'Institute Owner',
    subtitle: options?.subtitle ?? 'BrightPath Academy',
    initials,
  }
}

export function roleLabelFor(role: UserRole): string {
  if (role === 'student') return 'Student'
  if (role === 'tutor') return 'Tutor'
  return 'Owner'
}
