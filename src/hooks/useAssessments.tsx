import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { tutorAssessments } from '@/data/mock'
import type { TutorAssessmentSchedule } from '@/types'
import { assessmentMatchesScope, type AcademicScope } from '@/lib/academicScope'

interface StudentAssessmentQuery extends AcademicScope {
  studentId: string
}

interface AssessmentContextValue {
  assessments: TutorAssessmentSchedule[]
  addAssessment: (assessment: TutorAssessmentSchedule) => void
  getAssessmentsForStudent: (query: StudentAssessmentQuery) => TutorAssessmentSchedule[]
  canStudentAttend: (query: StudentAssessmentQuery, assessmentId: string) => boolean
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [assessments, setAssessments] = useState<TutorAssessmentSchedule[]>(() => [
    ...tutorAssessments,
  ])

  const addAssessment = useCallback((assessment: TutorAssessmentSchedule) => {
    setAssessments((prev) => [assessment, ...prev])
  }, [])

  const getAssessmentsForStudent = useCallback(
    (query: StudentAssessmentQuery) =>
      assessments.filter(
        (a) =>
          (a.status === 'live' || a.status === 'scheduled') &&
          a.assignedStudentIds.includes(query.studentId) &&
          assessmentMatchesScope(a, query),
      ),
    [assessments],
  )

  const canStudentAttend = useCallback(
    (query: StudentAssessmentQuery, assessmentId: string) => {
      const assessment = assessments.find((a) => a.id === assessmentId)
      return Boolean(
        assessment &&
          assessment.assignedStudentIds.includes(query.studentId) &&
          assessmentMatchesScope(assessment, query) &&
          (assessment.status === 'live' || assessment.status === 'scheduled'),
      )
    },
    [assessments],
  )

  const value = useMemo(
    () => ({
      assessments,
      addAssessment,
      getAssessmentsForStudent,
      canStudentAttend,
    }),
    [assessments, addAssessment, getAssessmentsForStudent, canStudentAttend],
  )

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}

export function useAssessments() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessments must be used within AssessmentProvider')
  return ctx
}
