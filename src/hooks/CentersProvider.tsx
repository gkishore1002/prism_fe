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
import { fetchCenters } from '@/lib/api/institutionsApi'
import type { InstitutionCenter } from '@/types'

export interface CentersContextValue {
  centers: InstitutionCenter[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  ensureLoaded: () => Promise<void>
}

export const CentersContext = createContext<CentersContextValue | null>(null)

export function CentersProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth()
  const [centers, setCenters] = useState<InstitutionCenter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)
  const loadPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    if (!isAuthenticated || role === 'student') {
      loadedRef.current = false
      loadPromiseRef.current = null
      setCenters([])
      setLoading(false)
      setError(null)
    }
  }, [isAuthenticated, role])

  const fetchOnce = useCallback(async (force = false) => {
    if (!isAuthenticated || role === 'student') return
    if (!force && loadedRef.current) return
    if (loadPromiseRef.current) {
      await loadPromiseRef.current
      return
    }

    setLoading(true)
    setError(null)
    loadPromiseRef.current = (async () => {
      try {
        const data = await fetchCenters()
        setCenters(data)
        loadedRef.current = true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load centers')
        setCenters([])
        loadedRef.current = false
      } finally {
        setLoading(false)
      }
    })().finally(() => {
      loadPromiseRef.current = null
    })

    await loadPromiseRef.current
  }, [isAuthenticated, role])

  const ensureLoaded = useCallback(async () => {
    await fetchOnce(false)
  }, [fetchOnce])

  const refresh = useCallback(async () => {
    loadedRef.current = false
    await fetchOnce(true)
  }, [fetchOnce])

  const value = useMemo(
    () => ({ centers, loading, error, refresh, ensureLoaded }),
    [centers, loading, error, refresh, ensureLoaded],
  )

  return <CentersContext.Provider value={value}>{children}</CentersContext.Provider>
}
