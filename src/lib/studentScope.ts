import type { StudentMasterRow } from '@/lib/api/analyticsApi'
import type { AcademicScope } from './academicScope'

export function getStudentAcademicScope(
  studentId: string,
  masterList: StudentMasterRow[],
): AcademicScope | null {
  const profile = masterList.find((s) => s.id === studentId)
  if (!profile) return null
  return { board: profile.board, grade: profile.grade }
}
