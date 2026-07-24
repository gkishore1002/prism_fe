import { apiFetch } from '@/lib/apiClient'
import { mapCenter, type ApiCenter } from '@/lib/api/mappers'
import type { CenterAnalytics } from '@/lib/api/analyticsApi'
import type { Institution, InstitutionCenter } from '@/types'

export async function fetchInstitution(code: string): Promise<Institution> {
  const data = await apiFetch<{
    id: string
    name: string
    code: string
    type: string
    boardIds: string[]
  }>(`/institutions/${code}`, { auth: false })
  return {
    id: data.id,
    name: data.name,
    type: data.type as Institution['type'],
    boardIds: data.boardIds,
    studentCount: 0,
    tutorCount: 0,
  }
}

export async function fetchCenters(): Promise<InstitutionCenter[]> {
  const data = await apiFetch<ApiCenter[]>('/centers')
  return data.map(mapCenter)
}

/** Centers with live analytics (student counts, avg health). */
export async function fetchCentersAnalytics(): Promise<CenterAnalytics[]> {
  return apiFetch<CenterAnalytics[]>('/analytics/institution/centers')
}

export async function createCenter(name: string, city: string): Promise<InstitutionCenter> {
  const data = await apiFetch<ApiCenter>('/centers', {
    method: 'POST',
    body: JSON.stringify({ name, city }),
  })
  return mapCenter(data)
}
