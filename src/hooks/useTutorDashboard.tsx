import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { useCurriculum } from '@/hooks/useCurriculum'
import { analyticsApi } from '@/lib/api/analyticsApi'
import { isApiEnabled } from '@/lib/apiClient'
import {
  fetchTutorDashboardSettings,
  resetTutorDashboardSettings,
  saveTutorDashboardSettings,
} from '@/lib/api/tutorDashboardApi'
import { buildTutorCopilotSummary, dedupeHeroTopics } from '@/modules/tutor/lib/buildTutorCopilotSummary'
import {
  defaultTutorDashboardHeroContent,
  defaultTutorDashboardPageContent,
  type TutorDashboardHeroContent,
  type TutorDashboardHeroSummary,
} from '@/modules/tutor/lib/dashboardContent'
import type { BatchTopicWeakness } from '@/types'

const HERO_BATCH_KEY = 'prism_hero_batch_id'

interface TutorDashboardContextValue {
  pageTitle: string
  pageSubtitle: string
  pageEyebrow: string
  heroContent: TutorDashboardHeroContent
  heroSummary: TutorDashboardHeroSummary
  lastUpdatedAt: string | null
  selectedBatchId: string
  setSelectedBatchId: (batchId: string) => void
  activeBatchId: string
  updatePageContent: (patch: Partial<{ title: string; subtitle: string; eyebrow: string }>) => void
  updateHeroContent: (patch: Partial<TutorDashboardHeroContent>) => void
  updateHeroSummary: (patch: Partial<TutorDashboardHeroSummary>) => void
  resetHero: () => void
}

const TutorDashboardContext = createContext<TutorDashboardContextValue | null>(null)

function formatEyebrow(board?: string, grade?: string) {
  return `${board ?? 'CBSE'} · ${grade ?? 'Grade 8'}`
}

interface DashboardEditableState {
  pageTitle: string
  pageSubtitle: string
  pageEyebrow: string
  heroContent: TutorDashboardHeroContent
  heroSummaryOverride: Partial<TutorDashboardHeroSummary> | null
  lastUpdatedAt: string | null
}

function defaultEditableState(defaultEyebrow: string): DashboardEditableState {
  return {
    pageTitle: defaultTutorDashboardPageContent.title,
    pageSubtitle: defaultTutorDashboardPageContent.subtitle,
    pageEyebrow: defaultEyebrow,
    heroContent: defaultTutorDashboardHeroContent,
    heroSummaryOverride: null,
    lastUpdatedAt: null,
  }
}

async function persistState(
  state: Omit<DashboardEditableState, 'lastUpdatedAt'>,
): Promise<string | null> {
  if (!isApiEnabled()) return null
  const saved = await saveTutorDashboardSettings({
    pageTitle: state.pageTitle,
    pageSubtitle: state.pageSubtitle,
    pageEyebrow: state.pageEyebrow,
    heroContent: state.heroContent,
    heroSummaryOverride: state.heroSummaryOverride,
  })
  return saved.updatedAt
}

export function TutorDashboardProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { batches, students, ensureLoaded: ensureCurriculumLoaded } = useCurriculum()
  const { copilot, topicWeakness } = useAnalytics()
  const [selectedBatchId, setSelectedBatchIdState] = useState(
    () => sessionStorage.getItem(HERO_BATCH_KEY) ?? '',
  )
  const [batchTopicWeakness, setBatchTopicWeakness] = useState<BatchTopicWeakness[]>(topicWeakness)

  const activeBatch =
    batches.find((b) => b.id === selectedBatchId) ?? batches[0] ?? undefined
  const defaultEyebrow = formatEyebrow(activeBatch?.board, activeBatch?.grade)

  const [state, setState] = useState<DashboardEditableState>(() =>
    defaultEditableState(defaultEyebrow),
  )

  useEffect(() => {
    if (isAuthenticated) void ensureCurriculumLoaded()
  }, [isAuthenticated, ensureCurriculumLoaded])

  useEffect(() => {
    if (!selectedBatchId && batches[0]?.id) {
      setSelectedBatchIdState(batches[0].id)
    }
  }, [selectedBatchId, batches])

  useEffect(() => {
    if (!isApiEnabled() || !isAuthenticated) return
    fetchTutorDashboardSettings()
      .then((saved) => {
        setState({
          pageTitle: saved.pageTitle,
          pageSubtitle: saved.pageSubtitle,
          pageEyebrow: saved.pageEyebrow,
          heroContent: saved.heroContent as TutorDashboardHeroContent,
          heroSummaryOverride: saved.heroSummaryOverride,
          lastUpdatedAt: saved.updatedAt,
        })
      })
      .catch(() => {
        // keep defaults on first visit
      })
  }, [isAuthenticated])

  useEffect(() => {
    if (!isApiEnabled() || !activeBatch?.id) {
      setBatchTopicWeakness(topicWeakness)
      return
    }
    let cancelled = false
    void analyticsApi
      .tutorTopicWeakness(activeBatch.id)
      .then((rows) => {
        if (!cancelled) setBatchTopicWeakness(rows)
      })
      .catch(() => {
        if (!cancelled) setBatchTopicWeakness(topicWeakness)
      })
    return () => {
      cancelled = true
    }
  }, [activeBatch?.id, topicWeakness])

  const setSelectedBatchId = useCallback((batchId: string) => {
    setSelectedBatchIdState(batchId)
    sessionStorage.setItem(HERO_BATCH_KEY, batchId)
  }, [])

  const computedSummary = useMemo(
    () => buildTutorCopilotSummary(activeBatch, students, copilot, batchTopicWeakness),
    [activeBatch, students, copilot, batchTopicWeakness],
  )

  const heroSummary = useMemo(() => {
    const merged = { ...computedSummary, ...state.heroSummaryOverride }
    const { strongTopics, weakTopics } = dedupeHeroTopics(
      merged.strongTopics,
      merged.weakTopics,
    )
    return { ...merged, strongTopics, weakTopics }
  }, [computedSummary, state.heroSummaryOverride])

  const updatePageContent = useCallback(
    (patch: Partial<{ title: string; subtitle: string; eyebrow: string }>) => {
      setState((prev) => {
        const next = {
          pageTitle: patch.title ?? prev.pageTitle,
          pageSubtitle: patch.subtitle ?? prev.pageSubtitle,
          pageEyebrow: patch.eyebrow ?? prev.pageEyebrow,
          heroContent: prev.heroContent,
          heroSummaryOverride: prev.heroSummaryOverride,
        }
        void persistState(next).then((updatedAt) => {
          if (updatedAt) setState((s) => ({ ...s, lastUpdatedAt: updatedAt }))
        })
        return { ...next, lastUpdatedAt: prev.lastUpdatedAt }
      })
    },
    [],
  )

  const updateHeroContent = useCallback((patch: Partial<TutorDashboardHeroContent>) => {
    setState((prev) => {
      const next = {
        pageTitle: prev.pageTitle,
        pageSubtitle: prev.pageSubtitle,
        pageEyebrow: prev.pageEyebrow,
        heroContent: { ...prev.heroContent, ...patch },
        heroSummaryOverride: prev.heroSummaryOverride,
      }
      void persistState(next).then((updatedAt) => {
        if (updatedAt) setState((s) => ({ ...s, lastUpdatedAt: updatedAt }))
      })
      return { ...next, lastUpdatedAt: prev.lastUpdatedAt }
    })
  }, [])

  const updateHeroSummary = useCallback((patch: Partial<TutorDashboardHeroSummary>) => {
    setState((prev) => {
      const next = {
        pageTitle: prev.pageTitle,
        pageSubtitle: prev.pageSubtitle,
        pageEyebrow: prev.pageEyebrow,
        heroContent: prev.heroContent,
        heroSummaryOverride: { ...prev.heroSummaryOverride, ...patch },
      }
      void persistState(next).then((updatedAt) => {
        if (updatedAt) setState((s) => ({ ...s, lastUpdatedAt: updatedAt }))
      })
      return { ...next, lastUpdatedAt: prev.lastUpdatedAt }
    })
  }, [])

  const resetHero = useCallback(() => {
    if (isApiEnabled()) {
      void resetTutorDashboardSettings()
    }
    setState({ ...defaultEditableState(formatEyebrow(activeBatch?.board, activeBatch?.grade)), lastUpdatedAt: null })
  }, [activeBatch?.board, activeBatch?.grade])

  const value = useMemo(
    () => ({
      pageTitle: state.pageTitle,
      pageSubtitle: state.pageSubtitle,
      pageEyebrow: state.pageEyebrow,
      heroContent: state.heroContent,
      heroSummary,
      lastUpdatedAt: state.lastUpdatedAt,
      selectedBatchId: activeBatch?.id ?? '',
      setSelectedBatchId,
      activeBatchId: activeBatch?.id ?? '',
      updatePageContent,
      updateHeroContent,
      updateHeroSummary,
      resetHero,
    }),
    [
      state.pageTitle,
      state.pageSubtitle,
      state.pageEyebrow,
      state.heroContent,
      state.lastUpdatedAt,
      heroSummary,
      activeBatch?.id,
      setSelectedBatchId,
      updatePageContent,
      updateHeroContent,
      updateHeroSummary,
      resetHero,
    ],
  )

  return (
    <TutorDashboardContext.Provider value={value}>{children}</TutorDashboardContext.Provider>
  )
}

export function useTutorDashboard() {
  const ctx = useContext(TutorDashboardContext)
  if (!ctx) {
    throw new Error('useTutorDashboard must be used within TutorDashboardProvider')
  }
  return ctx
}

export function useTutorDashboardOptional() {
  return useContext(TutorDashboardContext)
}
