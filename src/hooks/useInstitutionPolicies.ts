import { useCallback, useEffect, useState } from 'react'
import { fetchInstitutionPolicies } from '@/lib/api/institutionPoliciesApi'
import type { InstitutionPolicies } from '@/types'

let cached: InstitutionPolicies | null = null

export function useInstitutionPolicies() {
  const [policies, setPolicies] = useState<InstitutionPolicies | null>(cached)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchInstitutionPolicies()
      cached = data
      setPolicies(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load policies')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!cached) void refresh()
  }, [refresh])

  return { policies, loading, error, refresh }
}
