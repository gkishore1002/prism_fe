import {
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
import { useAcademicYears } from '@/hooks/useAcademicYears'
import * as assessmentsApi from '@/lib/api/assessmentsApi'
import type { TutorAssessmentSchedule } from '@/types'
import { assessmentMatchesScope } from '@/lib/academicScope'
import {
  AssessmentContext,
  type AssessmentContextValue,
  type StudentAssessmentQuery,
} from '@/hooks/assessmentContext'

export type { StudentAssessmentQuery, AssessmentContextValue }

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role, user } = useAuth()
  const { activeCenterId, isAllBranches } = useCenters()
  const { activeYearId } = useAcademicYears()
  const branchCenterId = isAllBranches ? undefined : activeCenterId
  const [assessments, setAssessments] = useState<TutorAssessmentSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadPromiseRef = useRef<Promise<void> | null>(null)
  const attendanceCacheRef = useRef<Map<string, Awaited<ReturnType<typeof assessmentsApi.fetchAttendance>>>>(
    new Map(),
  )

  const loadedBranchRef = useRef<string | 'all' | null>(null)
  const loadedYearRef = useRef<string | 'all' | null>(null)
  const loadedRoleRef = useRef<string | null>(null)
  const hasLoadedOnceRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    // Tutor/admin lists are year-scoped; wait for the year switcher.
    if (role !== 'student' && !activeYearId) return
    const isInitialLoad = !hasLoadedOnceRef.current
    if (isInitialLoad) setLoading(true)
    setError(null)
    try {
      const data =
        role === 'student'
          ? await assessmentsApi.fetchAssessmentsForStudent({ studentId: user.id })
          : await assessmentsApi.fetchAssessments(branchCenterId, activeYearId)
      setAssessments(data)
      attendanceCacheRef.current.clear()
      loadedBranchRef.current = role === 'student' ? 'all' : (branchCenterId ?? 'all')
      loadedYearRef.current = role === 'student' ? 'all' : (activeYearId ?? 'all')
      loadedRoleRef.current = role
      hasLoadedOnceRef.current = true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assessments')
    } finally {
      if (isInitialLoad) setLoading(false)
    }
  }, [isAuthenticated, role, user.id, branchCenterId, activeYearId])

  const ensureLoaded = useCallback(async () => {
    if (!isAuthenticated) return
    if (role !== 'student' && !activeYearId) return
    const branchKey = role === 'student' ? 'all' : (branchCenterId ?? 'all')
    const yearKey = role === 'student' ? 'all' : (activeYearId ?? 'all')
    const alreadyLoaded =
      loadedRoleRef.current === role &&
      loadedBranchRef.current === branchKey &&
      loadedYearRef.current === yearKey &&
      hasLoadedOnceRef.current

    if (!loadPromiseRef.current) {
      // Soft-refresh when already loaded so newly scheduled assessments appear
      // without requiring a full remount / logout.
      loadPromiseRef.current = refresh().finally(() => {
        loadPromiseRef.current = null
      })
    }
    // First visit: wait. Revisit: kick refresh but don't block UI on cached data.
    if (!alreadyLoaded || assessments.length === 0) {
      await loadPromiseRef.current
    }
  }, [isAuthenticated, role, assessments.length, branchCenterId, activeYearId, refresh])

  useEffect(() => {
    if (!isAuthenticated) {
      setAssessments([])
      loadedBranchRef.current = null
      loadedYearRef.current = null
      loadedRoleRef.current = null
      hasLoadedOnceRef.current = false
      return
    }
    // Admin shell: do not auto-fetch the full assessment list on every route.
    // Pages that need it call ensureLoaded / refresh explicitly.
    if (role === 'admin') return
    if (role !== 'student' && !activeYearId) return
    const branchKey = role === 'student' ? 'all' : (branchCenterId ?? 'all')
    const yearKey = role === 'student' ? 'all' : (activeYearId ?? 'all')
    if (
      loadedRoleRef.current === role &&
      loadedBranchRef.current === branchKey &&
      loadedYearRef.current === yearKey
    ) {
      return
    }
    void refresh()
  }, [isAuthenticated, role, branchCenterId, activeYearId, refresh])

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
      assessments.filter((a) => {
        if (a.status === 'draft') return false
        // Student list API already returns this student's papers. Re-checking
        // assignedStudentIds/board/grade drops live exams when login id and
        // profile id differ, or when scope labels do not match exactly.
        if (role === 'student') return true
        const ids = a.assignedStudentIds ?? []
        return ids.includes(query.studentId) && assessmentMatchesScope(a, query)
      }),
    [assessments, role],
  )

  const canStudentAttend = useCallback(
    (query: StudentAssessmentQuery, assessmentId: string) => {
      const assessment = assessments.find((a) => a.id === assessmentId)
      if (!assessment) return false
      if (assessment.studentSubmitted) return false
      const allowed =
        assessment.attemptInProgress ||
        assessment.canAttend ||
        (assessment.canAttend == null &&
          assessment.status === 'live' &&
          !assessment.timingOver)
      if (!allowed) return false
      if (role === 'student') return true
      const ids = assessment.assignedStudentIds ?? []
      return ids.includes(query.studentId) && assessmentMatchesScope(assessment, query)
    },
    [assessments, role],
  )

  const markAssessmentSubmitted = useCallback((assessmentId: string) => {
    setAssessments((prev) =>
      prev.map((a) =>
        a.id === assessmentId
          ? { ...a, studentSubmitted: true, attemptInProgress: false, canAttend: false }
          : a,
      ),
    )
  }, [])

  const markAssessmentInProgress = useCallback((assessmentId: string) => {
    setAssessments((prev) =>
      prev.map((a) =>
        a.id === assessmentId
          ? {
              ...a,
              attemptInProgress: true,
              studentSubmitted: false,
              canAttend: a.canAttend ?? true,
            }
          : a,
      ),
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
      markAssessmentInProgress,
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
      markAssessmentInProgress,
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
