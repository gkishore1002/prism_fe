import { apiFetch } from '@/lib/apiClient'
import {
  mapAssessment,
  mapAttendance,
  mapQuestion,
  type ApiAssessment,
  type ApiAttendanceRecord,
  type ApiQuestion,
} from '@/lib/api/mappers'
import type {
  AssessmentAttendanceRecord,
  AssessmentAccessRequest,
  AccessRequestReviewContext,
  QuestionBankEntry,
  TutorAssessmentSchedule,
} from '@/types'

type PaginatedAssessments = { items: ApiAssessment[] }

function unwrapAssessments(data: ApiAssessment[] | PaginatedAssessments): ApiAssessment[] {
  if (Array.isArray(data)) return data
  return data.items ?? []
}

export async function fetchAssessments(centerId?: string): Promise<TutorAssessmentSchedule[]> {
  const data = await apiFetch<ApiAssessment[] | PaginatedAssessments>(
    `/assessments${centerId ? `?center_id=${encodeURIComponent(centerId)}` : ''}`,
  )
  return unwrapAssessments(data).map(mapAssessment)
}

export async function fetchAssessment(assessmentId: string): Promise<TutorAssessmentSchedule> {
  const data = await apiFetch<ApiAssessment>(`/assessments/${encodeURIComponent(assessmentId)}`)
  return mapAssessment(data)
}

export interface StudentAssessmentQuery {
  studentId: string
  board?: string
  grade?: string
}

export async function fetchAssessmentsForStudent(
  query: StudentAssessmentQuery,
): Promise<TutorAssessmentSchedule[]> {
  const params = new URLSearchParams()
  if (query.board) params.set('board', query.board)
  if (query.grade) params.set('grade', query.grade)
  const qs = params.toString()
  const path = `/assessments/student/${encodeURIComponent(query.studentId)}${qs ? `?${qs}` : ''}`
  const data = await apiFetch<ApiAssessment[]>(path)
  return data.map(mapAssessment)
}

export async function createAssessment(
  assessment: TutorAssessmentSchedule,
): Promise<TutorAssessmentSchedule> {
  const data = await apiFetch<ApiAssessment>('/assessments', {
    method: 'POST',
    body: JSON.stringify({
      title: assessment.title,
      board: assessment.board,
      grade: assessment.grade,
      subject: assessment.subject,
      scope: assessment.scope,
      mode: assessment.mode,
      batchName: assessment.batchName,
      questionCount: assessment.questionCount,
      durationMinutes: assessment.durationMinutes,
      scheduledAt: assessment.scheduledAt,
      availableUntil: assessment.availableUntil ?? assessment.scheduledAt,
      status: assessment.status,
      centerIds: assessment.centerIds ?? [],
      selectedQuestionIds: assessment.selectedQuestionIds,
      assignedStudentIds: assessment.assignedStudentIds,
      chapter: assessment.chapter,
      topic: assessment.topic,
      questionPaperId: assessment.questionPaperId,
      paperCoverage: assessment.paperCoverage,
      selectedTopics: assessment.selectedTopics,
      shuffleQuestions: assessment.shuffleQuestions ?? false,
    }),
  })
  return mapAssessment(data)
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await apiFetch(`/assessments/${assessmentId}`, { method: 'DELETE' })
}

export async function updateAssessment(
  assessmentId: string,
  patch: Partial<
    Pick<TutorAssessmentSchedule, 'title' | 'status' | 'scheduledAt' | 'availableUntil'>
  >,
): Promise<TutorAssessmentSchedule> {
  const data = await apiFetch<ApiAssessment>(`/assessments/${assessmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return mapAssessment(data)
}

export async function fetchAssessmentQuestions(
  assessmentId: string,
): Promise<QuestionBankEntry[]> {
  const data = await apiFetch<ApiQuestion[]>(`/assessments/${assessmentId}/questions`)
  return data.map(mapQuestion)
}

export async function submitAssessment(
  assessmentId: string,
  answers: { questionId: string; selectedOption: string }[],
  timeSpentMin: number,
  deviceId?: string,
): Promise<void> {
  await apiFetch(`/assessments/${assessmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      answers: answers.map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption,
      })),
      timeSpentMin,
      deviceId: deviceId || undefined,
    }),
  })
}

export async function fetchAttendance(
  assessmentId: string,
): Promise<AssessmentAttendanceRecord[]> {
  const data = await apiFetch<ApiAttendanceRecord[]>(`/assessments/${assessmentId}/attendance`)
  return data.map(mapAttendance)
}

export async function fetchMySubmission(
  assessmentId: string,
): Promise<{ id: string; submittedAt: string } | null> {
  try {
    const data = await apiFetch<{ id: string; submittedAt: string }>(
      `/assessments/${assessmentId}/my-submission`,
    )
    return data
  } catch (e) {
    if (e instanceof Error && 'status' in e && (e as { status: number }).status === 404) {
      return null
    }
    throw e
  }
}

export interface ExamAttemptAnswer {
  questionId: string
  selectedOption: string
}

export interface ExamAttempt {
  answers: ExamAttemptAnswer[]
  currentIndex: number
  flaggedIds: string[]
  remainingSeconds: number | null
  status: 'in_progress' | 'attended' | 'absent'
}

export async function fetchExamAttempt(assessmentId: string): Promise<ExamAttempt | null> {
  try {
    const data = await apiFetch<ExamAttempt>(`/assessments/${assessmentId}/attempt`)
    return data
  } catch (e) {
    if (e instanceof Error && 'status' in e) {
      const status = (e as { status: number }).status
      if (status === 404) return null
      if (status === 409) throw e
    }
    throw e
  }
}

export async function saveExamAttempt(
  assessmentId: string,
  body: {
    answers: ExamAttemptAnswer[]
    currentIndex: number
    flaggedIds: string[]
    remainingSeconds: number | null
    deviceId?: string
  },
): Promise<void> {
  await apiFetch(`/assessments/${assessmentId}/attempt`, {
    method: 'PUT',
    body: JSON.stringify({
      answers: body.answers,
      currentIndex: body.currentIndex,
      flaggedIds: body.flaggedIds,
      remainingSeconds: body.remainingSeconds,
      deviceId: body.deviceId,
    }),
  })
}

export interface ExamSessionInfo {
  id: string
  assessmentId: string
  deviceId: string
  status: 'active' | 'ended' | 'terminated'
  startedAt: string
  lastHeartbeatAt: string
  violationCount: number
  maxViolations: number
}

export async function claimExamSession(
  assessmentId: string,
  deviceId: string,
): Promise<ExamSessionInfo> {
  return apiFetch<ExamSessionInfo>(`/assessments/${encodeURIComponent(assessmentId)}/session`, {
    method: 'POST',
    body: JSON.stringify({ deviceId }),
  })
}

export async function examSessionHeartbeat(
  assessmentId: string,
  deviceId: string,
  lastActivityAt?: string,
): Promise<ExamSessionInfo> {
  return apiFetch<ExamSessionInfo>(
    `/assessments/${encodeURIComponent(assessmentId)}/session/heartbeat`,
    {
      method: 'POST',
      body: JSON.stringify({ deviceId, lastActivityAt }),
    },
  )
}

export type ExamViolationType =
  | 'FULLSCREEN_EXIT'
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'DEVTOOLS_ATTEMPT'

export interface ExamViolationRecordResult {
  terminated: boolean
  violationCount: number
  maxViolations: number
  submission?: {
    id: string
    assessmentId: string
    studentId: string
    score: number
    maxScore: number
    timeSpentMin: number
    submittedAt: string
    status: string
    terminationReason?: string | null
  } | null
}

export async function recordExamViolation(
  assessmentId: string,
  type: ExamViolationType,
  deviceId: string,
  timestamp?: string,
): Promise<ExamViolationRecordResult> {
  return apiFetch<ExamViolationRecordResult>(
    `/assessments/${encodeURIComponent(assessmentId)}/violations`,
    {
      method: 'POST',
      body: JSON.stringify({
        type,
        deviceId,
        timestamp: timestamp ?? new Date().toISOString(),
      }),
    },
  )
}

export async function createAccessRequest(
  assessmentId: string,
  reason: string,
): Promise<AssessmentAccessRequest> {
  return apiFetch<AssessmentAccessRequest>(
    `/assessments/${encodeURIComponent(assessmentId)}/access-request`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  )
}

export async function fetchAccessRequests(
  status?: 'pending' | 'approved' | 'rejected',
): Promise<AssessmentAccessRequest[]> {
  const qs = status ? `?status=${status}` : ''
  return apiFetch<AssessmentAccessRequest[]>(`/assessments/access-requests${qs}`)
}

export async function fetchAccessRequestReviewContext(
  requestId: string,
): Promise<AccessRequestReviewContext> {
  return apiFetch<AccessRequestReviewContext>(
    `/assessments/access-requests/${encodeURIComponent(requestId)}/review-context`,
  )
}

export async function reviewAccessRequest(
  requestId: string,
  body: { status: 'approved' | 'rejected'; reviewNotes?: string; extensionDays?: number },
): Promise<AssessmentAccessRequest> {
  return apiFetch<AssessmentAccessRequest>(`/assessments/access-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
