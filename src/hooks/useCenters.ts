import { useContext, useEffect } from 'react'
import { CentersContext, type CentersContextValue } from '@/hooks/CentersProvider'

export { CentersProvider } from '@/hooks/CentersProvider'

/**
 * Shared branch list (GET /centers) — one fetch app-wide via CentersProvider.
 */
export function useCenters(options?: { enabled?: boolean }): CentersContextValue {
  const ctx = useContext(CentersContext)
  if (!ctx) throw new Error('useCenters must be used within CentersProvider')
  const enabled = options?.enabled ?? true
  const { ensureLoaded } = ctx

  useEffect(() => {
    if (!enabled) return
    void ensureLoaded()
  }, [enabled, ensureLoaded])

  return ctx
}
