import type { UserRole } from '@/types'

const SESSION_KEY = 'learnova_session'

export interface LearnovaSession {
  email: string
  role: UserRole
  userId: string
}

export function persistSession(session: LearnovaSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function readSession(): LearnovaSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LearnovaSession
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function dashboardPathForRole(role: UserRole): string {
  return `/${role}`
}
