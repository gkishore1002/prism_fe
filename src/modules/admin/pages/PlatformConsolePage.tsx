import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Crown, Users } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Button } from '@/components/ui/Button'
import { authTheme } from '@/modules/auth/lib/authTheme'
import {
  fetchPlatformOrganizations,
  fetchPlatformStats,
  type PlatformOrganization,
  type PlatformStats,
} from '@/lib/api/platformApi'

type StatusFilter = 'all' | 'active' | 'inactive'

export function PlatformConsolePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextStats, orgs] = await Promise.all([fetchPlatformStats(), fetchPlatformOrganizations()])
      setStats(nextStats)
      setOrganizations(orgs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organizations')
      setStats(null)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return organizations.filter((org) => {
      if (statusFilter === 'active' && !org.isActive) return false
      if (statusFilter === 'inactive' && org.isActive) return false
      if (!term) return true
      return org.name.toLowerCase().includes(term) || org.code.toLowerCase().includes(term)
    })
  }, [organizations, search, statusFilter])

  if (loading) return <PageLoader label="Loading organizations…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        sub="View registered organizations and open settings for each tenant."
        actions={
          <Button type="button" variant="primary" size="sm" onClick={() => navigate('/admin/platform/onboard')}>
            Add organization
          </Button>
        }
      />

      {error && (
        <AppCard>
          <p className="text-sm text-red-600">{error}</p>
        </AppCard>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <AppCard className="flex items-center gap-4">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Organizations</p>
              <p className="text-2xl font-semibold text-foreground">{stats.totalOrganizations}</p>
            </div>
          </AppCard>
          <AppCard className="flex items-center gap-4">
            <div className="rounded-xl bg-leaf/10 p-3 text-leaf">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold text-foreground">{stats.totalActiveOrganizations}</p>
            </div>
          </AppCard>
          <AppCard className="flex items-center gap-4">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Platform admins</p>
              <p className="text-2xl font-semibold text-foreground">{stats.totalSuperAdmins}</p>
            </div>
          </AppCard>
        </div>
      )}

      <AppCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={authTheme.input}
                placeholder="Search by name or code…"
              />
            </div>
            <div className="sm:w-40">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={authTheme.input}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No organizations match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Organization</th>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Admins</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-3 font-medium text-foreground">{org.name}</td>
                    <td className="px-3 py-3 font-mono text-xs">{org.code}</td>
                    <td className="px-3 py-3 capitalize text-muted-foreground">{org.type}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {org.adminCount}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {org.isActive ? (
                        <span className="text-leaf">Active</span>
                      ) : (
                        <span className="text-rose">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/admin/platform/organizations/${org.code}`)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          <Link to="/admin/platform/admins" className="text-accent hover:underline">
            Platform admins
          </Link>{' '}
          manage accounts that sign in with org code SYSTEM.
        </p>
      </AppCard>
    </div>
  )
}
