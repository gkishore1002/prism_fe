import { studentMasterProfiles } from '@/data/mock'
import type { AcademicScope } from './academicScope'

export function getStudentAcademicScope(studentId: string): AcademicScope | null {
  const profile = studentMasterProfiles.find((s) => s.id === studentId)
  if (!profile) return null
  return { board: profile.board, grade: profile.grade }
}
