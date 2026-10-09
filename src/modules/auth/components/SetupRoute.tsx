import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PrismLoader'
import { fetchSetupStatus } from '@/modules/auth/lib/setupApi'

const SETUP_STATUS_TIMEOUT_MS = 12_000

async function loadSetupStatus() {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Setup status timed out')), SETUP_STATUS_TIMEOUT_MS)
  })
  return Promise.race([fetchSetupStatus(), timeout])
}

export function SetupRequiredRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'setup' | 'ready'>('loading')

  useEffect(() => {
    let cancelled = false
    loadSetupStatus()
      .then((status) => {
        if (!cancelled) setState(status.setupRequired ? 'setup' : 'ready')
      })
      .catch(() => {
        // Fail open to the app when API is cold/unreachable — avoids a permanent blank page.
        if (!cancelled) setState('ready')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') {
    return <PageLoader label="Loading…" />
  }
  if (state === 'setup') return <Navigate to="/setup" replace />
  return children
}

export function SetupOnlyRoute({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    loadSetupStatus()
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

  if (allowed === null) {
    return <PageLoader label="Loading…" />
  }
  if (!allowed) return <Navigate to="/login" replace />
  return children
}
