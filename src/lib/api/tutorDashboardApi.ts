import { apiFetch } from '@/lib/apiClient'
import type {
  TutorDashboardHeroContent,
  TutorDashboardHeroSummary,
} from '@/modules/tutor/lib/dashboardContent'

export interface TutorDashboardSavedState {
  pageTitle: string
  pageSubtitle: string
  pageEyebrow: string
  heroContent: TutorDashboardHeroContent
  heroSummaryOverride: Partial<TutorDashboardHeroSummary> | null
  updatedAt: string
}

interface ApiDashboardSettings {
  pageTitle: string
  pageSubtitle: string
  pageEyebrow: string
  heroContent: TutorDashboardHeroContent
  heroSummaryOverride: Partial<TutorDashboardHeroSummary> | null
  updatedAt: string
}

export async function fetchTutorDashboardSettings(): Promise<TutorDashboardSavedState> {
  const data = await apiFetch<ApiDashboardSettings>('/tutor/dashboard')
  return {
    pageTitle: data.pageTitle,
    pageSubtitle: data.pageSubtitle,
    pageEyebrow: data.pageEyebrow,
    heroContent: data.heroContent,
    heroSummaryOverride: data.heroSummaryOverride,
    updatedAt: data.updatedAt,
  }
}

export async function saveTutorDashboardSettings(
  state: Omit<TutorDashboardSavedState, 'updatedAt'>,
): Promise<TutorDashboardSavedState> {
  const data = await apiFetch<ApiDashboardSettings>('/tutor/dashboard', {
    method: 'PUT',
    body: JSON.stringify({
      pageTitle: state.pageTitle,
      pageSubtitle: state.pageSubtitle,
      pageEyebrow: state.pageEyebrow,
      heroContent: state.heroContent,
      heroSummaryOverride: state.heroSummaryOverride,
    }),
  })
  return {
    pageTitle: data.pageTitle,
    pageSubtitle: data.pageSubtitle,
    pageEyebrow: data.pageEyebrow,
    heroContent: data.heroContent,
    heroSummaryOverride: data.heroSummaryOverride,
    updatedAt: data.updatedAt,
  }
}

export async function resetTutorDashboardSettings(): Promise<void> {
  await apiFetch('/tutor/dashboard', { method: 'DELETE' })
}
