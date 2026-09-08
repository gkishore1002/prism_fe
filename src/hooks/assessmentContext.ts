import { createContext } from 'react'
import type { AssessmentAttendanceRecord, TutorAssessmentSchedule } from '@/types'
import type { AcademicScope } from '@/lib/academicScope'

export interface StudentAssessmentQuery extends AcademicScope {
  studentId: string
}

export interface AssessmentContextValue {
  assessments: TutorAssessmentSchedule[]
  loading: boolean
  error: string | null
  addAssessment: (assessment: TutorAssessmentSchedule) => Promise<void>
  removeAssessment: (assessmentId: string) => Promise<void>
  patchAssessment: (
    assessmentId: string,
    patch: Partial<Pick<TutorAssessmentSchedule, 'title' | 'status' | 'scheduledAt'>>,
  ) => Promise<void>
  getAssessmentsForStudent: (query: StudentAssessmentQuery) => TutorAssessmentSchedule[]
  canStudentAttend: (query: StudentAssessmentQuery, assessmentId: string) => boolean
  markAssessmentSubmitted: (assessmentId: string) => void
  markAssessmentInProgress: (assessmentId: string) => void
  getAttendance: (assessmentId: string) => Promise<AssessmentAttendanceRecord[]>
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>
}

/**
 * Kept in a separate module so Vite HMR of useAssessments.tsx does not recreate
 * the context object (which breaks Provider ↔ consumer pairing until full reload).
 */
export const AssessmentContext = createContext<AssessmentContextValue | null>(null)
