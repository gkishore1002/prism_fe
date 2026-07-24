import type {
  AppNotification,
  AssessmentAttendanceRecord,
  QuestionBankEntry,
  QuestionPaper,
  StudentSummary,
  TutorAssessmentSchedule,
  TutorBatch,
  UserRole,
} from '@/types'
import type { CurriculumBoard } from '@/types/curriculum'
import type { InstitutionCenter } from '@/types'

// ─── Curriculum ───────────────────────────────────────────────────────────────

export interface ApiCurriculumBoard {
  board: string
  grades: { grade: string; subjects: { name: string; topics: { name: string; questions: number; mastery: number }[] }[] }[]
}

export function mapCurriculumBoards(data: ApiCurriculumBoard[]): CurriculumBoard[] {
  return data.map((b) => ({
    board: b.board,
    grades: b.grades.map((g) => ({
      grade: g.grade,
      subjects: g.subjects.map((s) => ({
        name: s.name,
        topics: s.topics.map((t) => ({
          name: t.name,
          questions: t.questions,
          mastery: t.mastery,
        })),
      })),
    })),
  }))
}

// ─── Students & batches ───────────────────────────────────────────────────────

export interface ApiStudentSummary {
  id: string
  name: string
  grade: string
  health: number
  status: StudentSummary['status']
  readiness: number
  lastAssessment: string
  criticalGaps: number
  improving: boolean
  board?: string | null
  batch?: string | null
  centerId?: string | null
  academicYear?: string | null
}

export function mapStudent(s: ApiStudentSummary): StudentSummary {
  return {
    id: s.id,
    name: s.name,
    grade: s.grade,
    board: s.board ?? 'CBSE',
    batch: s.batch ?? undefined,
    centerId: s.centerId ?? undefined,
    academicYear: s.academicYear ?? undefined,
    health: s.health,
    status: s.status,
    readiness: s.readiness,
    lastAssessment: s.lastAssessment,
    criticalGaps: s.criticalGaps,
    improving: s.improving,
  }
}

export interface ApiTutorBatch {
  id: string
  name: string
  board: string
  grade: string
  subject?: string | null
  scheduleTiming?: string | null
  studentIds: string[]
  avgScore?: number | null
}

export function mapBatch(b: ApiTutorBatch): TutorBatch {
  return {
    id: b.id,
    name: b.name,
    board: b.board,
    grade: b.grade,
    subject: b.subject ?? undefined,
    scheduleTiming: b.scheduleTiming ?? undefined,
    studentIds: b.studentIds,
    avgScore: b.avgScore ?? undefined,
  }
}

// ─── Questions & papers ───────────────────────────────────────────────────────

export interface ApiQuestion {
  id: string
  board: string
  grade: string
  subject: string
  chapter: string
  topic: string
  difficulty: QuestionBankEntry['difficulty']
  marks: number
  questionType: QuestionBankEntry['questionType']
  text: string
  status: QuestionBankEntry['status']
  optionA?: string | null
  optionB?: string | null
  optionC?: string | null
  optionD?: string | null
  correctAnswer?: string | null
}

export function mapQuestion(q: ApiQuestion): QuestionBankEntry {
  return {
    id: q.id,
    board: q.board,
    grade: q.grade,
    subject: q.subject,
    chapter: q.chapter,
    topic: q.topic,
    difficulty: q.difficulty,
    marks: q.marks,
    questionType: q.questionType,
    text: q.text,
    status: q.status,
    optionA: q.optionA ?? undefined,
    optionB: q.optionB ?? undefined,
    optionC: q.optionC ?? undefined,
    optionD: q.optionD ?? undefined,
    correctAnswer: q.correctAnswer ?? undefined,
  }
}

export interface ApiQuestionPaper {
  id: string
  name: string
  board: string
  grade: string
  subject: string
  questionIds: string[]
  topics: string[]
  totalMarks: number
  createdAt: string
  createdBy?: string | null
  source: QuestionPaper['source']
  parentPaperId?: string | null
}

export function mapQuestionPaper(p: ApiQuestionPaper): QuestionPaper {
  return {
    id: p.id,
    name: p.name,
    board: p.board,
    grade: p.grade,
    subject: p.subject,
    questionIds: p.questionIds,
    topics: p.topics,
    totalMarks: p.totalMarks,
    createdAt: p.createdAt,
    createdBy: p.createdBy ?? undefined,
    source: p.source,
    parentPaperId: p.parentPaperId ?? undefined,
  }
}

// ─── Assessments ──────────────────────────────────────────────────────────────

export interface ApiAssessment {
  id: string
  title: string
  board: string
  grade: string
  subject: string
  scope: TutorAssessmentSchedule['scope']
  mode: TutorAssessmentSchedule['mode']
  batchName: string
  questionCount: number
  durationMinutes: number
  scheduledAt: string
  status: TutorAssessmentSchedule['status']
  classAvg?: number | null
  centerIds: string[]
  selectedQuestionIds: string[]
  assignedStudentIds: string[]
  createdByTutorId?: string | null
  chapter?: string | null
  topic?: string | null
  questionPaperId?: string | null
  paperCoverage?: TutorAssessmentSchedule['paperCoverage']
  selectedTopics?: string[] | null
  studentSubmitted?: boolean
}

export function mapAssessment(a: ApiAssessment): TutorAssessmentSchedule {
  return {
    id: a.id,
    title: a.title,
    board: a.board,
    grade: a.grade,
    subject: a.subject,
    scope: a.scope,
    mode: a.mode,
    batchName: a.batchName,
    questionCount: a.questionCount,
    durationMinutes: a.durationMinutes,
    scheduledAt: a.scheduledAt,
    status: a.status,
    classAvg: a.classAvg ?? undefined,
    centerIds: a.centerIds,
    selectedQuestionIds: a.selectedQuestionIds,
    assignedStudentIds: a.assignedStudentIds,
    createdByTutorId: a.createdByTutorId ?? undefined,
    chapter: a.chapter ?? undefined,
    topic: a.topic ?? undefined,
    questionPaperId: a.questionPaperId ?? undefined,
    paperCoverage: a.paperCoverage ?? undefined,
    selectedTopics: a.selectedTopics ?? undefined,
    studentSubmitted: Boolean(a.studentSubmitted),
  }
}

export interface ApiAttendanceRecord {
  studentId: string
  studentName: string
  status: AssessmentAttendanceRecord['status']
  score?: number | null
  maxScore?: number | null
  timeSpentMin?: number | null
  submittedAt?: string | null
}

export function mapAttendance(r: ApiAttendanceRecord): AssessmentAttendanceRecord {
  return {
    studentId: r.studentId,
    studentName: r.studentName,
    status: r.status,
    score: r.score ?? undefined,
    maxScore: r.maxScore ?? undefined,
    timeSpentMin: r.timeSpentMin ?? undefined,
    submittedAt: r.submittedAt ?? undefined,
  }
}

export function attendancePercentage(record: AssessmentAttendanceRecord): number | null {
  if (record.score == null || !record.maxScore) return null
  return Math.round((record.score / record.maxScore) * 100)
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string
  role: UserRole
  kind: AppNotification['kind']
  title: string
  message: string
  createdAt: string
  read: boolean
  href?: string | null
}

export function mapNotification(n: ApiNotification): AppNotification {
  return {
    id: n.id,
    role: n.role,
    kind: n.kind,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    read: n.read,
    href: n.href ?? undefined,
  }
}

// ─── Centers ─────────────────────────────────────────────────────────────────

export interface ApiCenter {
  id: string
  name: string
  city: string
  studentCount: number
  batchCount: number
}

export function mapCenter(c: ApiCenter): InstitutionCenter {
  return {
    id: c.id,
    name: c.name,
    city: c.city,
    studentCount: c.studentCount,
    batchCount: c.batchCount,
  }
}
