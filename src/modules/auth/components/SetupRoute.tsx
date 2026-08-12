import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { fetchSetupStatus } from '@/modules/auth/lib/setupApi'

export function SetupRequiredRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'setup' | 'ready'>('loading')

  useEffect(() => {
    let cancelled = false
    fetchSetupStatus()
      .then((status) => {
        if (!cancelled) setState(status.setupRequired ? 'setup' : 'ready')
      })
      .catch(() => {
        if (!cancelled) setState('ready')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') return null
  if (state === 'setup') return <Navigate to="/setup" replace />
  return children
}

export function SetupOnlyRoute({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSetupStatus()
      .then((status) => {
        if (!cancelled) setAllowed(status.setupRequired)
      })
      .catch(() => {
        if (!cancelled) setAllowed(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (allowed === null) return null
  if (!allowed) return <Navigate to="/login" replace />
  return children
}
