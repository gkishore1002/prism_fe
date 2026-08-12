import { apiFetch } from '@/lib/apiClient'
import type { InstitutionPolicies } from '@/types'

export async function fetchInstitutionPolicies(): Promise<InstitutionPolicies> {
  return apiFetch<InstitutionPolicies>('/institution/policies')
}

export async function updateInstitutionPolicies(
  patch: Partial<InstitutionPolicies>,
): Promise<InstitutionPolicies> {
  return apiFetch<InstitutionPolicies>('/institution/policies', {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}
