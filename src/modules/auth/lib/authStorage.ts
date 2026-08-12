import type { User, UserRole } from '@/types'

const SESSION_KEY = 'prism_session'
const LEGACY_SESSION_KEY = 'learnova_session'
export const ACTIVE_BRANCH_KEY = 'prism_active_branch'

export interface PrismSession {
  email: string
  role: UserRole
  userId: string
  accessToken?: string
  user?: User
  adminPortal?: 'organization' | 'branch'
}

export function persistSession(session: PrismSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function readSession(): PrismSession | null {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as PrismSession
    if (!localStorage.getItem(SESSION_KEY) && localStorage.getItem(LEGACY_SESSION_KEY)) {
      persistSession(session)
      localStorage.removeItem(LEGACY_SESSION_KEY)
    }
    return session
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(LEGACY_SESSION_KEY)
  sessionStorage.removeItem(ACTIVE_BRANCH_KEY)
  sessionStorage.removeItem('prism_student_assessment_reminder')
  sessionStorage.removeItem('learnova_student_assessment_reminder')
}

export function dashboardPathForRole(role: UserRole): string {
  if (role === 'super_user') return '/admin/platform'
  return `/${role}`
}
