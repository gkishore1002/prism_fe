import { apiFetch } from '@/lib/apiClient'

export interface SetupStatus {
  initialized: boolean
  setupRequired: boolean
  defaultOrganizationCode: string
}

export interface SetupPayload {
  organizationName: string
  organizationCode?: string
  superAdminName: string
  superAdminPhone: string
  password?: string
}

export async function fetchSetupStatus(): Promise<SetupStatus> {
  return apiFetch<SetupStatus>('/setup/status', { auth: false })
}

export async function completeSetup(payload: SetupPayload): Promise<void> {
  await apiFetch('/setup', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })
}
