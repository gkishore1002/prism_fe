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
import {
  analyticsApi,
  type AtRiskStudent,
  type BoardReportRow,
  type CenterAnalytics,
  type InstitutionOverview,
  type InstitutionOperationalStats,
  type StudentMasterRow,
  type StudentProfileAnalytics,
  type TeacherRow,
  type TutorCopilotAnalytics,
} from '@/lib/api/analyticsApi'
import type {
  AcademicHealth,
  AssessmentResult,
  BatchTopicWeakness,
  ClassInsight,
  LearningGap,
  ReadinessPrediction,
  RecoveryStep,
  StudentWiseReport,
  TopicReadinessPrediction,
} from '@/types'

export type AnalyticsLoadKey =
  | 'shellStudent'
  | 'shellInstitution'
  | 'studentToday'
  | 'studentDashboard'
  | 'studentAssessments'
  | 'studentHealth'
  | 'studentGaps'
  | 'studentRecovery'
  | 'studentReadiness'
  | 'studentDiagnostics'
  | 'studentPlan'
  | 'studentReports'
  | 'studentReportDetail'
  | 'studentAlerts'
  | 'adminDashboard'
  | 'adminStudents'
  | 'adminCenters'
  | 'adminBoards'
  | 'adminTeachers'
  | 'adminSyllabus'
  | 'adminAnalytics'
  | 'adminInstitution'
  | 'tutorDashboard'
  | 'tutorBatches'
  | 'tutorAtRisk'
  | 'tutorNames'

interface AnalyticsContextValue {
  loading: boolean
  error: string | null
  load: (key: AnalyticsLoadKey | AnalyticsLoadKey[]) => Promise<void>
  refresh: (key?: AnalyticsLoadKey | AnalyticsLoadKey[]) => Promise<void>
  overview: InstitutionOverview | null
  operationalStats: InstitutionOperationalStats | null
  /** Branch performance metrics — only loaded on admin Centers page. */
  centerAnalytics: CenterAnalytics[]
  boardReport: BoardReportRow[]
  teachers: TeacherRow[]
  hardestTopics: { topic: string; correct: number }[]
  syllabusCompletion: Record<string, number | string>[]
  monthlyTrend: { month: string; score: number }[]
  subjectHealth: { subject: string; health: number }[]
  studentMaster: StudentMasterRow[]
  tutorNames: Record<string, string>
  studentProfile: StudentProfileAnalytics | null
  studentHealth: AcademicHealth | null
  learningGaps: LearningGap[]
  recoveryPlan: RecoveryStep[]
  readiness: ReadinessPrediction[]
  improvementTrend: { month: string; score: number }[]
  topicBreakdown: TopicReadinessPrediction[]
  studentSubjects: { name: string; health: number; status: string }[]
  recentAssessments: AssessmentResult[]
  studentReport: StudentWiseReport | null
  monthlyReports: { period: string; health: number; readiness: number; improvement: number }[]
  progressAlerts: { type: string; message: string; href: string }[]
  topicWeakness: BatchTopicWeakness[]
  atRisk: AtRiskStudent[]
  batchHeatmap: { topic: string; mastery: number }[]
  classInsights: ClassInsight[]
  copilot: TutorCopilotAnalytics | null
  loadStudentReport: (studentId: string) => Promise<StudentWiseReport>
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { activeCenterId, isAllBranches } = useCenters()
  const branchCenterId = isAllBranches ? undefined : activeCenterId
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(new Set<AnalyticsLoadKey>())

  const [overview, setOverview] = useState<InstitutionOverview | null>(null)
  const [operationalStats, setOperationalStats] = useState<InstitutionOperationalStats | null>(null)
  const [centerAnalytics, setCenterAnalytics] = useState<CenterAnalytics[]>([])
  const [boardReport, setBoardReport] = useState<BoardReportRow[]>([])
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [hardestTopics, setHardestTopics] = useState<{ topic: string; correct: number }[]>([])
  const [syllabusCompletion, setSyllabusCompletion] = useState<Record<string, number | string>[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; score: number }[]>([])
  const [subjectHealth, setSubjectHealth] = useState<{ subject: string; health: number }[]>([])
  const [studentMaster, setStudentMaster] = useState<StudentMasterRow[]>([])
  const [tutorNames, setTutorNames] = useState<Record<string, string>>({})

  const [studentProfile, setStudentProfile] = useState<StudentProfileAnalytics | null>(null)
  const [studentHealth, setStudentHealth] = useState<AcademicHealth | null>(null)
  const [learningGaps, setLearningGaps] = useState<LearningGap[]>([])
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryStep[]>([])
  const [readiness, setReadiness] = useState<ReadinessPrediction[]>([])
  const [improvementTrend, setImprovementTrend] = useState<{ month: string; score: number }[]>([])
  const [topicBreakdown, setTopicBreakdown] = useState<TopicReadinessPrediction[]>([])
  const [studentSubjects, setStudentSubjects] = useState<{ name: string; health: number; status: string }[]>([])
  const [recentAssessments, setRecentAssessments] = useState<AssessmentResult[]>([])
  const [studentReport, setStudentReport] = useState<StudentWiseReport | null>(null)
  const [monthlyReports, setMonthlyReports] = useState<
    { period: string; health: number; readiness: number; improvement: number }[]
  >([])
  const [progressAlerts, setProgressAlerts] = useState<{ type: string; message: string; href: string }[]>([])

  const [topicWeakness, setTopicWeakness] = useState<BatchTopicWeakness[]>([])
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([])
  const [batchHeatmap, setBatchHeatmap] = useState<{ topic: string; mastery: number }[]>([])
  const [classInsights, setClassInsights] = useState<ClassInsight[]>([])
  const [copilot, setCopilot] = useState<TutorCopilotAnalytics | null>(null)

  const runKey = useCallback(async (key: AnalyticsLoadKey) => {
    switch (key) {
      case 'shellStudent': {
        const profile = await analyticsApi.studentProfile()
        setStudentProfile(profile)
        break
      }
      case 'shellInstitution': {
        const data = await analyticsApi.institutionOverview(branchCenterId)
        setOverview(data)
        break
      }
      case 'studentToday': {
        const [profile, health, subjects, topicBreakdownData, trend, gaps, recovery, alerts, inst] =
          await Promise.all([
            analyticsApi.studentProfile(),
            analyticsApi.studentHealth(),
            analyticsApi.studentSubjects(),
            analyticsApi.topicBreakdown(),
            analyticsApi.improvementTrend(),
            analyticsApi.learningGaps(),
            analyticsApi.recoveryPlan(),
            analyticsApi.progressAlerts(),
            analyticsApi.institutionOverview(),
          ])
        setStudentProfile(profile)
        setStudentHealth(health)
        setStudentSubjects(subjects)
        setTopicBreakdown(topicBreakdownData)
        setImprovementTrend(trend)
        setLearningGaps(gaps)
        setRecoveryPlan(recovery)
        setProgressAlerts(alerts)
        setOverview(inst)
        break
      }
      case 'studentDashboard': {
        const [profile, health, gaps, recovery] = await Promise.all([
          analyticsApi.studentProfile(),
          analyticsApi.studentHealth(),
          analyticsApi.learningGaps(),
          analyticsApi.recoveryPlan(),
        ])
        setStudentProfile(profile)
        setStudentHealth(health)
        setLearningGaps(gaps)
        setRecoveryPlan(recovery)
        break
      }
      case 'studentAssessments': {
        const [profile, recent] = await Promise.all([
          analyticsApi.studentProfile(),
          analyticsApi.recentAssessments(),
        ])
        setStudentProfile(profile)
        setRecentAssessments(recent)
        break
      }
      case 'studentHealth': {
        setStudentHealth(await analyticsApi.studentHealth())
        break
      }
      case 'studentGaps': {
        setLearningGaps(await analyticsApi.learningGaps())
        break
      }
      case 'studentRecovery': {
        setRecoveryPlan(await analyticsApi.recoveryPlan())
        break
      }
      case 'studentReadiness': {
        const [profile, preds] = await Promise.all([
          analyticsApi.studentProfile(),
          analyticsApi.readiness(),
        ])
        setStudentProfile(profile)
        setReadiness(preds)
        break
      }
      case 'studentDiagnostics': {
        const [profile, topics, preds] = await Promise.all([
          analyticsApi.studentProfile(),
          analyticsApi.topicBreakdown(),
          analyticsApi.readiness(),
        ])
        setStudentProfile(profile)
        setTopicBreakdown(topics)
        setReadiness(preds)
        break
      }
      case 'studentPlan': {
        const [gaps, recovery, preds] = await Promise.all([
          analyticsApi.learningGaps(),
          analyticsApi.recoveryPlan(),
          analyticsApi.readiness(),
        ])
        setLearningGaps(gaps)
        setRecoveryPlan(recovery)
        setReadiness(preds)
        break
      }
      case 'studentReports': {
        const [report, monthly] = await Promise.all([
          analyticsApi.studentReport(),
          analyticsApi.monthlyReports(),
        ])
        setStudentReport(report)
        setMonthlyReports(monthly)
        break
      }
      case 'studentReportDetail': {
        setMonthlyReports(await analyticsApi.monthlyReports())
        break
      }
      case 'studentAlerts': {
        setProgressAlerts(await analyticsApi.progressAlerts())
        break
      }
      case 'adminDashboard': {
        const centerId = branchCenterId
        const [inst, ops, teacherRows, topics, trend, subjects, insights, risk] = await Promise.all([
          analyticsApi.institutionOverview(centerId),
          analyticsApi.institutionOperationalStats(centerId),
          analyticsApi.institutionTeachers(centerId),
          analyticsApi.hardestTopics(centerId),
          analyticsApi.monthlyTrend(centerId),
          analyticsApi.subjectHealth(centerId),
          analyticsApi.classInsights(centerId),
          analyticsApi.tutorAtRisk(undefined, undefined, centerId),
        ])
        setOverview(inst)
        setOperationalStats(ops)
        setTeachers(teacherRows)
        setHardestTopics(topics)
        setMonthlyTrend(trend)
        setSubjectHealth(subjects)
        setClassInsights(insights)
        setAtRisk(risk)
        break
      }
      case 'adminStudents': {
        setStudentMaster(await analyticsApi.studentMaster(branchCenterId))
        break
      }
      case 'adminCenters': {
        const centerId = branchCenterId
        const [inst, centers] = await Promise.all([
          analyticsApi.institutionOverview(centerId),
          analyticsApi.institutionCenters(centerId),
        ])
        setOverview(inst)
        setCenterAnalytics(centers)
        break
      }
      case 'adminBoards': {
        setBoardReport(await analyticsApi.institutionBoards(branchCenterId))
        break
      }
      case 'adminTeachers': {
        setTeachers(await analyticsApi.institutionTeachers(branchCenterId))
        break
      }
      case 'adminSyllabus': {
        setSyllabusCompletion(await analyticsApi.syllabusCompletion(branchCenterId))
        break
      }
      case 'adminAnalytics': {
        const centerId = branchCenterId
        const [trend, subjects] = await Promise.all([
          analyticsApi.monthlyTrend(centerId),
          analyticsApi.subjectHealth(centerId),
        ])
        setMonthlyTrend(trend)
        setSubjectHealth(subjects)
        break
      }
      case 'adminInstitution': {
        setOverview(await analyticsApi.institutionOverview(branchCenterId))
        break
      }
      case 'tutorDashboard': {
        const centerId = branchCenterId
        const [weakness, insights, risk, copilotData] = await Promise.all([
          analyticsApi.tutorTopicWeakness(undefined, undefined, centerId),
          analyticsApi.classInsights(centerId),
          analyticsApi.tutorAtRisk(undefined, undefined, centerId),
          analyticsApi.tutorCopilot(undefined, centerId),
        ])
        setTopicWeakness(weakness)
        setClassInsights(insights)
        setAtRisk(risk)
        setCopilot(copilotData)
        break
      }
      case 'tutorBatches': {
        setBatchHeatmap(await analyticsApi.tutorBatchHeatmap(undefined, undefined, branchCenterId))
        break
      }
      case 'tutorAtRisk': {
        setAtRisk(await analyticsApi.tutorAtRisk(undefined, undefined, branchCenterId))
        break
      }
      case 'tutorNames': {
        setTutorNames(await analyticsApi.tutorNames())
        break
      }
      default:
        break
    }
  }, [branchCenterId])

  const load = useCallback(
    async (keys: AnalyticsLoadKey | AnalyticsLoadKey[], force = false) => {
      if (!isAuthenticated) return
      const list = Array.isArray(keys) ? keys : [keys]
      const pending = force ? list : list.filter((k) => !loadedRef.current.has(k))
      if (pending.length === 0) return

      setLoading(true)
      setError(null)
      try {
        await Promise.all(pending.map((key) => runKey(key)))
        pending.forEach((k) => loadedRef.current.add(k))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated, runKey],
  )

  const refresh = useCallback(
    async (keys?: AnalyticsLoadKey | AnalyticsLoadKey[]) => {
      if (keys) {
        const list = Array.isArray(keys) ? keys : [keys]
        list.forEach((k) => loadedRef.current.delete(k))
        await load(list, true)
        return
      }
      const all = [...loadedRef.current]
      loadedRef.current.clear()
      await load(all, true)
    },
    [load],
  )

  const loadStudentReport = useCallback(async (studentId: string) => {
    return analyticsApi.studentReport(studentId)
  }, [])

  const value = useMemo(
    () => ({
      loading,
      error,
      load,
      refresh,
      overview,
      operationalStats,
      centerAnalytics,
      boardReport,
      teachers,
      hardestTopics,
      syllabusCompletion,
      monthlyTrend,
      subjectHealth,
      studentMaster,
      tutorNames,
      studentProfile,
      studentHealth,
      learningGaps,
      recoveryPlan,
      readiness,
      improvementTrend,
      topicBreakdown,
      studentSubjects,
      recentAssessments,
      studentReport,
      monthlyReports,
      progressAlerts,
      topicWeakness,
      atRisk,
      batchHeatmap,
      classInsights,
      copilot,
      loadStudentReport,
    }),
    [
      loading,
      error,
      load,
      refresh,
      overview,
      operationalStats,
      centerAnalytics,
      boardReport,
      teachers,
      hardestTopics,
      syllabusCompletion,
      monthlyTrend,
      subjectHealth,
      studentMaster,
      tutorNames,
      studentProfile,
      studentHealth,
      learningGaps,
      recoveryPlan,
      readiness,
      improvementTrend,
      topicBreakdown,
      studentSubjects,
      recentAssessments,
      studentReport,
      monthlyReports,
      progressAlerts,
      topicWeakness,
      atRisk,
      batchHeatmap,
      classInsights,
      copilot,
      loadStudentReport,
    ],
  )

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext)
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider')
  return ctx
}

/** Call once on mount for the current page's analytics needs. */
export function useAnalyticsPage(key: AnalyticsLoadKey | AnalyticsLoadKey[]) {
  const { load, loading, error } = useAnalytics()
  const { activeCenterId, isAllBranches } = useCenters()
  const branchCenterId = isAllBranches ? undefined : activeCenterId
  const keys = useMemo(() => (Array.isArray(key) ? key : [key]), [key])
  const keysKey = keys.join(',')

  useEffect(() => {
    void load(keys, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, keysKey, branchCenterId])

  return { loading, error }
}
