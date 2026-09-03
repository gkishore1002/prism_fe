import { apiFetch } from '@/lib/apiClient'
import {
  mapBatch,
  mapCurriculumBoards,
  mapStudent,
  type ApiCurriculumBoard,
  type ApiStudentSummary,
  type ApiTutorBatch,
} from '@/lib/api/mappers'
import type { StudentSummary, TutorBatch } from '@/types'
import type { CurriculumBoard } from '@/types/curriculum'

export async function deleteStudent(studentId: string): Promise<void> {
  await apiFetch(`/students/${studentId}`, { method: 'DELETE' })
}

export async function updateStudentApi(
  studentId: string,
  patch: Partial<{
    name: string
    board: string
    grade: string
    batch: string
    batchIds: string[]
    centerId: string
    status: string
  }>,
): Promise<void> {
  await apiFetch(`/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteBatch(batchId: string): Promise<void> {
  await apiFetch(`/batches/${batchId}`, { method: 'DELETE' })
}

export async function deleteBoard(board: string): Promise<void> {
  await apiFetch(`/curriculum/boards?board=${encodeURIComponent(board)}`, { method: 'DELETE' })
}

export async function deleteGrade(board: string, grade: string): Promise<void> {
  await apiFetch(
    `/curriculum/grades?board=${encodeURIComponent(board)}&grade=${encodeURIComponent(grade)}`,
    { method: 'DELETE' },
  )
}

export async function deleteSubject(board: string, grade: string, subject: string): Promise<void> {
  await apiFetch(
    `/curriculum/subjects?board=${encodeURIComponent(board)}&grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`,
    { method: 'DELETE' },
  )
}

export async function deleteTopic(
  board: string,
  grade: string,
  subject: string,
  topic: string,
): Promise<void> {
  await apiFetch(
    `/curriculum/topics?board=${encodeURIComponent(board)}&grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`,
    { method: 'DELETE' },
  )
}

export async function fetchCurriculum(): Promise<CurriculumBoard[]> {
  const data = await apiFetch<ApiCurriculumBoard[]>('/curriculum')
  return mapCurriculumBoards(data)
}

export async function fetchStudents(center?: string): Promise<StudentSummary[]> {
  const data = await apiFetch<ApiStudentSummary[]>(
    `/students${center ? `?center=${encodeURIComponent(center)}` : ''}`,
  )
  return data.map(mapStudent)
}

export async function fetchBatches(): Promise<TutorBatch[]> {
  const data = await apiFetch<ApiTutorBatch[]>('/batches')
  return data.map(mapBatch)
}

export async function fetchStudentsForBatch(batchId: string, center?: string): Promise<StudentSummary[]> {
  const data = await apiFetch<ApiStudentSummary[]>(
    `/batches/${batchId}/students${center ? `?center=${encodeURIComponent(center)}` : ''}`,
  )
  return data.map(mapStudent)
}

export async function addBoard(name: string): Promise<void> {
  await apiFetch('/curriculum/boards', { method: 'POST', body: JSON.stringify({ name }) })
}

export async function renameBoard(board: string, newName: string): Promise<void> {
  await apiFetch('/curriculum/boards', {
    method: 'PATCH',
    body: JSON.stringify({ board, newName }),
  })
}

export async function addGrade(board: string, grade: string): Promise<void> {
  await apiFetch('/curriculum/grades', { method: 'POST', body: JSON.stringify({ board, grade }) })
}

export async function renameGrade(board: string, grade: string, newName: string): Promise<void> {
  await apiFetch('/curriculum/grades', {
    method: 'PATCH',
    body: JSON.stringify({ board, grade, newName }),
  })
}

export async function addSubject(board: string, grade: string, subject: string): Promise<void> {
  await apiFetch('/curriculum/subjects', {
    method: 'POST',
    body: JSON.stringify({ board, grade, subject }),
  })
}

export async function renameSubject(
  board: string,
  grade: string,
  subject: string,
  newName: string,
): Promise<void> {
  await apiFetch('/curriculum/subjects', {
    method: 'PATCH',
    body: JSON.stringify({ board, grade, subject, newName }),
  })
}

export async function addTopic(
  board: string,
  grade: string,
  subject: string,
  topic: string,
): Promise<void> {
  await apiFetch('/curriculum/topics', {
    method: 'POST',
    body: JSON.stringify({ board, grade, subject, topic }),
  })
}

export async function renameTopic(
  board: string,
  grade: string,
  subject: string,
  topic: string,
  newName: string,
): Promise<void> {
  await apiFetch('/curriculum/topics', {
    method: 'PATCH',
    body: JSON.stringify({ board, grade, subject, topic, newName }),
  })
}

export async function updateBatch(
  batchId: string,
  patch: { name?: string; subject?: string; scheduleTiming?: string },
): Promise<void> {
  await apiFetch(`/batches/${batchId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function createBatch(batch: {
  name: string
  board: string
  grade: string
  subject?: string
  scheduleTiming?: string
  studentIds?: string[]
}): Promise<TutorBatch> {
  const data = await apiFetch<ApiTutorBatch>('/batches', {
    method: 'POST',
    body: JSON.stringify(batch),
  })
  return mapBatch(data)
}

export async function assignStudentToBatchApi(batchId: string, studentId: string): Promise<void> {
  await apiFetch(`/batches/${batchId}/students/${studentId}`, { method: 'POST' })
}

export async function removeStudentFromBatchApi(batchId: string, studentId: string): Promise<void> {
  await apiFetch(`/batches/${batchId}/students/${studentId}`, { method: 'DELETE' })
}

export async function createStudent(student: {
  name: string
  board: string
  grade: string
  batch?: string
  batchId?: string
  centerId?: string
  academicYear?: string
  phone?: string
  password?: string
  schoolName?: string
}): Promise<{ id: string; name: string }> {
  const data = await apiFetch<{ id: string; name: string }>('/students', {
    method: 'POST',
    body: JSON.stringify({
      name: student.name,
      board: student.board,
      grade: student.grade,
      batch: student.batch ?? '',
      batchId: student.batchId,
      centerId: student.centerId ?? '',
      academicYear: student.academicYear ?? '2025-26',
      phone: student.phone,
      password: student.password,
      schoolName: student.schoolName,
    }),
  })
  return { id: data.id, name: data.name }
}
