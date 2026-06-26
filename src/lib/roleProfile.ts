import type { User, UserRole } from '@/types'
import {
  currentStudent,
  currentTutor,
  currentAdmin,
  institution,
  studentProfile,
} from '@/data/mock'
import type { ModuleId } from '@/lib/modules'

export interface RoleProfile {
  name: string
  roleLabel: string
  subtitle: string
  initials: string
}

const usersByModule: Record<ModuleId, User> = {
  student: currentStudent,
  tutor: currentTutor,
  admin: currentAdmin,
}

export function getSidebarProfile(moduleId: ModuleId, authUser: User): RoleProfile {
  const portalUser = authUser.role === moduleId ? authUser : usersByModule[moduleId]
  const parts = portalUser.name.trim().split(/\s+/)
  const initials = parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (moduleId === 'student') {
    return {
      name: portalUser.name,
      roleLabel: 'Student',
      subtitle: `${studentProfile.board} · Grade ${studentProfile.grade} · ${studentProfile.batch}`,
      initials,
    }
  }

  if (moduleId === 'tutor') {
    return {
      name: portalUser.name,
      roleLabel: 'Tutor',
      subtitle: 'Mathematics · CBSE Grade 8',
      initials,
    }
  }

  return {
    name: portalUser.name,
    roleLabel: 'Institute Owner',
    subtitle: institution.name,
    initials,
  }
}

export function roleLabelFor(role: UserRole): string {
  if (role === 'student') return 'Student'
  if (role === 'tutor') return 'Tutor'
  return 'Owner'
}
