import { useCallback, useEffect, useState } from 'react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Button } from '@/components/ui/Button'
import { authTheme } from '@/modules/auth/lib/authTheme'
import {
  createPlatformSuperAdmin,
  fetchPlatformSuperAdmins,
  type PlatformSuperAdmin,
} from '@/lib/api/platformApi'

export function PlatformSuperUsersPage() {
  const [admins, setAdmins] = useState<PlatformSuperAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAdmins(await fetchPlatformSuperAdmins())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load platform admins')
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setCreateError('Passwords do not match.')
      return
    }
    setCreating(true)
    setCreateError(null)
    setSuccess(null)
    try {
      await createPlatformSuperAdmin({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
      })
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setSuccess('Platform admin created.')
      await load()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create platform admin')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <PageLoader label="Loading platform admins…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform admins"
        sub="Accounts that sign in with org code SYSTEM to manage organizations on this deployment."
      />

      {error && (
        <AppCard>
          <p className="text-sm text-red-600">{error}</p>
        </AppCard>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <AppCard>
          <h3 className="mb-4 font-semibold text-foreground">Platform admin accounts</h3>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No platform admin accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-3 font-medium text-foreground">{admin.fullName}</td>
                      <td className="px-3 py-3 text-muted-foreground">{admin.email}</td>
                      <td className="px-3 py-3">
                        {admin.isActive ? (
                          <span className="text-leaf">Active</span>
                        ) : (
                          <span className="text-rose">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>

        <AppCard>
          <h3 className="mb-4 font-semibold text-foreground">Add platform admin</h3>
          {createError && <p className="mb-3 text-sm text-red-600">{createError}</p>}
          {success && <p className="mb-3 text-sm text-leaf">{success}</p>}
          <form className="space-y-3" onSubmit={(e) => void handleCreate(e)}>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={authTheme.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authTheme.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authTheme.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirm password</label>
              <input
                required
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={authTheme.input}
              />
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? 'Creating…' : 'Add platform admin'}
            </Button>
          </form>
        </AppCard>
      </div>
    </div>
  )
}
