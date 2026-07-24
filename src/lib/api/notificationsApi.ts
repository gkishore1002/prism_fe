import { apiFetch } from '@/lib/apiClient'
import { mapNotification, type ApiNotification } from '@/lib/api/mappers'
import type { AppNotification, UserRole } from '@/types'

export async function fetchNotifications(role?: UserRole): Promise<AppNotification[]> {
  const query = role ? `?role=${role}` : ''
  const data = await apiFetch<ApiNotification[]>(`/notifications${query}`)
  return data.map(mapNotification)
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const data = await apiFetch<ApiNotification>(`/notifications/${id}/read`, { method: 'PATCH' })
  return mapNotification(data)
}

export async function markAllNotificationsRead(role: UserRole): Promise<void> {
  await apiFetch(`/notifications/read-all?role=${role}`, { method: 'PATCH' })
}

export async function clearNotifications(role: UserRole): Promise<void> {
  await apiFetch(`/notifications?role=${role}`, { method: 'DELETE' })
}
