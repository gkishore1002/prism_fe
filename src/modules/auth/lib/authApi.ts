import { currentStudent, currentTutor, currentAdmin, institution } from '@/data/mock'
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
}

export interface LoginPendingRoles {
  type: 'role_selection'
  email: string
  roles: RoleOption[]
}

export type LoginResult = LoginSuccess | LoginPendingRoles

const DEMO_PASSWORD = 'demo123'

const roleUsers: Record<UserRole, User> = {
  student: currentStudent,
  tutor: currentTutor,
  admin: currentAdmin,
}

const allRoles: RoleOption[] = [
  { role: 'student', label: 'Student', description: 'Today, practice, diagnostics, reports, and alerts — all in one portal' },
  { role: 'tutor', label: 'Tutor', description: 'Students, assessments, curriculum setup, and class intelligence' },
  { role: 'admin', label: 'Admin', description: 'Institution intelligence and analytics' },
]

/** Mock login — accepts any @brightpath.edu email or demo@learnova.app */
export async function loginLearnova(
  email: string,
  password: string,
  _institutionCode: string,
): Promise<LoginResult> {
  await delay(400)

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || password !== DEMO_PASSWORD) {
    throw new Error('Invalid email or password. Use demo123 as the password.')
  }

  const isDemoAccount = normalizedEmail.endsWith('@brightpath.edu') || normalizedEmail === 'demo@learnova.app'
  if (!isDemoAccount) {
    throw new Error('Use a @brightpath.edu email or demo@learnova.app for this demo.')
  }

  // Single-role accounts skip selection
  if (normalizedEmail === currentStudent.email) {
    return { type: 'authenticated', email: normalizedEmail, role: 'student', user: currentStudent }
  }
  if (normalizedEmail === currentTutor.email) {
    return { type: 'authenticated', email: normalizedEmail, role: 'tutor', user: currentTutor }
  }
  if (normalizedEmail === currentAdmin.email) {
    return { type: 'authenticated', email: normalizedEmail, role: 'admin', user: currentAdmin }
  }

  // Generic demo login → role selection (Swotify pattern)
  return {
    type: 'role_selection',
    email: normalizedEmail,
    roles: allRoles,
  }
}

export function resolveRoleLogin(email: string, role: UserRole): LoginSuccess {
  return {
    type: 'authenticated',
    email,
    role,
    user: roleUsers[role],
  }
}

export function getInstitutionName() {
  return institution.name
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
