import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Button } from '@/components/ui/Button'
import { authTheme } from '@/modules/auth/lib/authTheme'
import {
  fetchPlatformOrganization,
  updatePlatformOrganization,
  type PlatformOrganizationDetail,
} from '@/lib/api/platformApi'
import type { Institution } from '@/types'

const ORG_TYPES: Institution['type'][] = ['coaching', 'school', 'tuition', 'training']

export function PlatformOrganizationPage() {
  const { code = '' } = useParams<{ code: string }>()
  const [org, setOrg] = useState<PlatformOrganizationDetail | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<Institution['type']>('coaching')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!code) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPlatformOrganization(code)
      setOrg(data)
      setName(data.name)
      setType(data.type as Institution['type'])
      setIsActive(data.isActive)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organization')
      setOrg(null)
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!org) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updatePlatformOrganization(org.code, {
        name: name.trim(),
        type,
        isActive,
      })
      setOrg((prev) => (prev ? { ...prev, ...updated } : prev))
      setSuccess('Organization settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader label="Loading organization…" />

  if (!org) {
    return (
      <AppCard>
        <p className="text-sm text-red-600">{error ?? 'Organization not found.'}</p>
      </AppCard>
    )
  }

  const dirty = name.trim() !== org.name || type !== org.type || isActive !== org.isActive

  return (
    <div className="space-y-6">
      <PageHeader
        title={org.name}
        sub="Organization settings and admin accounts for this tenant."
      />

      {error && (
        <AppCard>
          <p className="text-sm text-red-600">{error}</p>
        </AppCard>
      )}
      {success && (
        <AppCard className="border-leaf/30 bg-leaf/5">
          <p className="text-sm text-foreground">{success}</p>
        </AppCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Organization settings</h3>
          </div>
          <form className="space-y-4" onSubmit={(e) => void handleSave(e)}>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={authTheme.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Organization type</label>
              <select value={type} onChange={(e) => setType(e.target.value as Institution['type'])} className={authTheme.input}>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border"
              />
              <span>
                Active — inactive organizations cannot sign in at login
              </span>
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="primary" size="sm" disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={saving || !dirty}
                onClick={() => {
                  setName(org.name)
                  setType(org.type as Institution['type'])
                  setIsActive(org.isActive)
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </AppCard>

        <AppCard>
          <h3 className="mb-4 font-semibold text-foreground">Details</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Organization code</dt>
              <dd className="mt-0.5 font-mono text-xs">{org.code}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tenant schema</dt>
              <dd className="mt-0.5 font-mono text-xs text-muted-foreground">{org.schemaName}</dd>
            </div>
            {org.owner && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Organization owner</dt>
                <dd className="mt-0.5">
                  <span className="font-medium text-foreground">{org.owner.name}</span>
                  <span className="block text-muted-foreground">{org.owner.email}</span>
                </dd>
              </div>
            )}
          </dl>
        </AppCard>
      </div>

      <AppCard>
        <h3 className="mb-4 font-semibold text-foreground">Organization admins</h3>
        {!org.admins?.length ? (
          <p className="text-sm text-muted-foreground">No organization admin accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {org.admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-3 font-medium text-foreground">{admin.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{admin.email}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {admin.isOwner ? 'Organization owner' : 'Branch admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppCard>
    </div>
  )
}
