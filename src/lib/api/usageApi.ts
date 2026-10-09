import { apiFetch } from '@/lib/apiClient'

export interface UsageTotals {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  callCount: number
}

export interface UsageByService extends UsageTotals {
  service: string
}

export interface UsageByDay extends UsageTotals {
  date: string
}

export interface InstitutionUsage {
  institutionId: string
  range: { start: string; end: string }
  totals: UsageTotals
  byService: UsageByService[]
  byDay: UsageByDay[]
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function fetchInstitutionUsage(rangeDays = 30): Promise<InstitutionUsage> {
  const start = isoDaysAgo(Math.max(1, rangeDays) - 1)
  const end = todayIso()
  const qs = new URLSearchParams({ start, end })
  return apiFetch<InstitutionUsage>(`/usage/institution/me?${qs.toString()}`)
}

export async function fetchInstitutionUsageForDay(day: string): Promise<InstitutionUsage> {
  const qs = new URLSearchParams({ start: day, end: day })
  return apiFetch<InstitutionUsage>(`/usage/institution/me?${qs.toString()}`)
}
