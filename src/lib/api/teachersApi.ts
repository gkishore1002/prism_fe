import { apiFetch } from '@/lib/apiClient'

export interface TutorAccount {
  id: string
  name: string
  email: string
}

export async function fetchTutors(): Promise<TutorAccount[]> {
  return apiFetch<TutorAccount[]>('/tutors')
}

export async function createTutor(payload: {
  name: string
  phone: string
  password?: string
  alsoAdmin?: boolean
  centerIds?: string[]
  isOwner?: boolean
}): Promise<TutorAccount> {
  return apiFetch<TutorAccount>('/tutors', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTutor(
  tutorId: string,
  payload: Partial<{ name: string; email: string }>,
): Promise<TutorAccount> {
  return apiFetch<TutorAccount>(`/tutors/${encodeURIComponent(tutorId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
