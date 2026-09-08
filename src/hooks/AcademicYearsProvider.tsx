import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { academicYearsApi, type AcademicYear } from '@/lib/api/academicYearsApi'

const ACTIVE_YEAR_KEY = 'prism.activeAcademicYearId'

export interface AcademicYearsContextValue {
  years: AcademicYear[]
  loading: boolean
  error: string | null
  activeYearId: string | undefined
  activeYear: AcademicYear | null
  currentYear: AcademicYear | null
  setActiveYearId: (yearId: string) => void
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>
  createYear: (input: {
    name: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
  }) => Promise<AcademicYear>
  setCurrentYear: (yearId: string) => Promise<AcademicYear>
}

export const AcademicYearsContext = createContext<AcademicYearsContextValue | null>(null)

function readStoredYearId(): string | null {
  return sessionStorage.getItem(ACTIVE_YEAR_KEY)
}

export function AcademicYearsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [activeYearId, setActiveYearIdState] = useState<string | undefined>(() => {
    return readStoredYearId() ?? undefined
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)
  const loadPromiseRef = useRef<Promise<void> | null>(null)

  const setActiveYearId = useCallback((yearId: string) => {
    setActiveYearIdState(yearId)
    sessionStorage.setItem(ACTIVE_YEAR_KEY, yearId)
  }, [])

  const fetchOnce = useCallback(
    async (force = false) => {
      if (!isAuthenticated) return
      // Students use /me/enrollments on portal pages; skip org year list so
      // student auth/portal flows stay unchanged.
      if (role === 'student') {
        setYears([])
        setActiveYearIdState(undefined)
        loadedRef.current = true
        setLoading(false)
        setError(null)
        return
      }
      if (loadedRef.current && !force) return
      if (loadPromiseRef.current && !force) return loadPromiseRef.current

      const run = (async () => {
        setLoading(true)
        setError(null)
        try {
          const list = await academicYearsApi.list()
          setYears(list)
          loadedRef.current = true
          const stored = readStoredYearId()
          const match = list.find((y) => y.id === stored)
          const current = list.find((y) => y.isCurrent) ?? list[0]
          if (match) {
            setActiveYearIdState(match.id)
          } else if (current) {
            setActiveYearId(current.id)
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to load academic years')
        } finally {
          setLoading(false)
          loadPromiseRef.current = null
        }
      })()
      loadPromiseRef.current = run
      return run
    },
    [isAuthenticated, role, setActiveYearId],
  )

  const refresh = useCallback(async () => {
    loadedRef.current = false
    await fetchOnce(true)
  }, [fetchOnce])

  const ensureLoaded = useCallback(async () => {
    await fetchOnce(false)
  }, [fetchOnce])

  const createYear = useCallback(
    async (input: {
      name: string
      startDate?: string
      endDate?: string
      isCurrent?: boolean
    }) => {
      const created = await academicYearsApi.create(input)
      await refresh()
      setActiveYearId(created.id)
      return created
    },
    [refresh, setActiveYearId],
  )

  const setCurrentYear = useCallback(
    async (yearId: string) => {
      const updated = await academicYearsApi.setCurrent(yearId)
      await refresh()
      setActiveYearId(updated.id)
      return updated
    },
    [refresh, setActiveYearId],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      loadedRef.current = false
      setYears([])
      setActiveYearIdState(undefined)
      return
    }
    void fetchOnce(false)
  }, [isAuthenticated, role, fetchOnce])

  const activeYear = useMemo(
    () => years.find((y) => y.id === activeYearId) ?? null,
    [years, activeYearId],
  )
  const currentYear = useMemo(() => years.find((y) => y.isCurrent) ?? years[0] ?? null, [years])

  const value = useMemo<AcademicYearsContextValue>(
    () => ({
      years,
      loading,
      error,
      activeYearId,
      activeYear,
      currentYear,
      setActiveYearId,
      refresh,
      ensureLoaded,
      createYear,
      setCurrentYear,
    }),
    [
      years,
      loading,
      error,
      activeYearId,
      activeYear,
      currentYear,
      setActiveYearId,
      refresh,
      ensureLoaded,
      createYear,
      setCurrentYear,
    ],
  )

  return (
    <AcademicYearsContext.Provider value={value}>{children}</AcademicYearsContext.Provider>
  )
}
