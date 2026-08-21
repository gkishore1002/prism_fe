import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCenters } from '@/hooks/useCenters'
import * as assessmentsApi from '@/lib/api/assessmentsApi'
import type { AssessmentAttendanceRecord, TutorAssessmentSchedule } from '@/types'
import { assessmentMatchesScope, type AcademicScope } from '@/lib/academicScope'

interface StudentAssessmentQuery extends AcademicScope {
  studentId: string
}

interface AssessmentContextValue {
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
  getAttendance: (assessmentId: string) => Promise<AssessmentAttendanceRecord[]>
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role, user } = useAuth()
  const { activeCenterId, isAllBranches } = useCenters()
  const branchCenterId = isAllBranches ? undefined : activeCenterId
  const [assessments, setAssessments] = useState<TutorAssessmentSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadPromiseRef = useRef<Promise<void> | null>(null)
  const attendanceCacheRef = useRef<Map<string, AssessmentAttendanceRecord[]>>(new Map())

  const loadedBranchRef = useRef<string | 'all' | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const data =
        role === 'student'
          ? await assessmentsApi.fetchAssessmentsForStudent({ studentId: user.id })
          : await assessmentsApi.fetchAssessments(branchCenterId)
      setAssessments(data)
      attendanceCacheRef.current.clear()
      loadedBranchRef.current = role === 'student' ? 'all' : (branchCenterId ?? 'all')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, role, user.id, branchCenterId])

  const ensureLoaded = useCallback(async () => {
    if (!isAuthenticated) return
    const key = role === 'student' ? 'all' : (branchCenterId ?? 'all')
    if (assessments.length > 0 && loadedBranchRef.current === key) return
    if (!loadPromiseRef.current) {
      loadPromiseRef.current = refresh().finally(() => {
        loadPromiseRef.current = null
      })
    }
    await loadPromiseRef.current
  }, [isAuthenticated, role, assessments.length, branchCenterId, refresh])

  useEffect(() => {
    if (!isAuthenticated) {
      setAssessments([])
      loadedBranchRef.current = null
      return
    }
    if (role === 'student') return
    const key = branchCenterId ?? 'all'
    if (loadedBranchRef.current === key) return
    void refresh()
  }, [isAuthenticated, role, branchCenterId, refresh])

  const addAssessment = useCallback(async (assessment: TutorAssessmentSchedule) => {
    const created = await assessmentsApi.createAssessment(assessment)
    setAssessments((prev) => {
      if (prev.some((a) => a.id === created.id)) return prev
      return [created, ...prev]
    })
  }, [])

  const removeAssessment = useCallback(async (assessmentId: string) => {
    await assessmentsApi.deleteAssessment(assessmentId)
    attendanceCacheRef.current.delete(assessmentId)
    setAssessments((prev) => prev.filter((a) => a.id !== assessmentId))
  }, [])

  const patchAssessment = useCallback(
    async (
      assessmentId: string,
      patch: Partial<Pick<TutorAssessmentSchedule, 'title' | 'status' | 'scheduledAt'>>,
    ) => {
      const updated = await assessmentsApi.updateAssessment(assessmentId, patch)
      setAssessments((prev) => prev.map((a) => (a.id === assessmentId ? updated : a)))
    },
    [],
  )

  const getAssessmentsForStudent = useCallback(
    (query: StudentAssessmentQuery) =>
      assessments.filter(
        (a) =>
          a.status !== 'draft' &&
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
          (assessment.canAttend ??
            (assessment.status === 'live' &&
              !assessment.studentSubmitted &&
              !assessment.timingOver)) &&
          assessment.assignedStudentIds.includes(query.studentId) &&
          assessmentMatchesScope(assessment, query),
      )
    },
    [assessments],
  )

  const markAssessmentSubmitted = useCallback((assessmentId: string) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === assessmentId ? { ...a, studentSubmitted: true } : a)),
    )
  }, [])

  const getAttendance = useCallback(async (assessmentId: string) => {
    const cached = attendanceCacheRef.current.get(assessmentId)
    if (cached) return cached
    const data = await assessmentsApi.fetchAttendance(assessmentId)
    attendanceCacheRef.current.set(assessmentId, data)
    return data
  }, [])

  const value = useMemo(
    () => ({
      assessments,
      loading,
      error,
      addAssessment,
      removeAssessment,
      patchAssessment,
      getAssessmentsForStudent,
      canStudentAttend,
      markAssessmentSubmitted,
      getAttendance,
      refresh,
      ensureLoaded,
    }),
    [
      assessments,
      loading,
      error,
      addAssessment,
      removeAssessment,
      patchAssessment,
      getAssessmentsForStudent,
      canStudentAttend,
      markAssessmentSubmitted,
      getAttendance,
      refresh,
      ensureLoaded,
    ],
  )

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}

export function useAssessments() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessments must be used within AssessmentProvider')
  return ctx
}
