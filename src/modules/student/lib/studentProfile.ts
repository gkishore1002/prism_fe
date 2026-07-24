import type { StudentProfileAnalytics } from '@/lib/api/analyticsApi'
import type { User } from '@/types'
import { scopeLabel } from '@/lib/academicScope'

export function formatStudentGrade(grade: string): string {
  const trimmed = grade.trim()
  if (/^grade\s/i.test(trimmed)) return trimmed
  const num = trimmed.match(/\d+/)?.[0]
  return num ? `Grade ${num}` : trimmed
}

export function studentProfileEyebrow(
  profile: StudentProfileAnalytics,
  institutionName?: string,
): string {
  const parts = [
    profile.board,
    formatStudentGrade(profile.grade),
    profile.batch,
  ].filter(Boolean)
  if (institutionName) parts.push(institutionName)
  return parts.join(' · ')
}

export function studentProfileSubtitle(profile: StudentProfileAnalytics): string {
  return `${profile.board} · ${formatStudentGrade(profile.grade)} · ${profile.batch}`
}

export function resolveStudentProfile(
  profile: StudentProfileAnalytics | null,
  _user: User,
): StudentProfileAnalytics | null {
  return profile
}

export function academicScopeFromProfile(profile: StudentProfileAnalytics) {
  return { board: profile.board, grade: profile.grade }
}

export function scopeLabelFromProfile(profile: StudentProfileAnalytics): string {
  return scopeLabel(academicScopeFromProfile(profile))
}
