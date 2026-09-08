import { apiFetch } from '@/lib/apiClient'

export interface AcademicYear {
  id: string
  institutionId: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface StudentEnrollment {
  id: string
  studentId: string
  academicYearId: string
  academicYear: string
  board: string
  grade: string
  batchId: string | null
  batch: string
  centerId: string | null
  centerName: string
  status: string
  enrolledAt: string
  completedAt: string | null
  isCurrent: boolean
}

export interface PromoteStudentPayload {
  academicYearId: string
  board: string
  grade: string
  batchId?: string | null
  centerId?: string | null
  priorStatus?:
    | 'completed'
    | 'detained'
    | 'transferred'
    | 'dropped'
    | 'graduated'
    | 'inactive'
}

export const academicYearsApi = {
  list: () => apiFetch<AcademicYear[]>('/academic-years'),
  create: (body: { name: string; startDate?: string; endDate?: string; isCurrent?: boolean }) =>
    apiFetch<AcademicYear>('/academic-years', { method: 'POST', body: JSON.stringify(body) }),
  setCurrent: (yearId: string) =>
    apiFetch<AcademicYear>(`/academic-years/${yearId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCurrent: true }),
    }),
  listEnrollments: (studentId: string) =>
    apiFetch<StudentEnrollment[]>(`/students/${studentId}/enrollments`),
  myEnrollments: () => apiFetch<StudentEnrollment[]>('/me/enrollments'),
  promote: (studentId: string, body: PromoteStudentPayload) =>
    apiFetch<StudentEnrollment>(`/students/${studentId}/promote`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
