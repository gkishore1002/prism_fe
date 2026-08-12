import { useCallback, useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { btnClass } from '@/components/ui/Button'
import { PhoneCredentialFields } from '@/components/auth/PhoneCredentialFields'
import { useCenters } from '@/hooks/useCenters'
import {
  createAdmin,
  fetchAdmins,
  setAdminBranches,
  type OrgAdminUser,
} from '@/lib/api/institutionsApi'
import { formatCenterLabel } from '@/lib/centerLabel'
import { isValidPhone, phoneToLoginEmail, resolvePassword } from '@/lib/phoneAuth'

export function AdminAdminsPage() {
  const { centers, canManageTenant, isPlatformSuperUser, ensureLoaded } = useCenters()
  const [admins, setAdmins] = useState<OrgAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [alsoTutor, setAlsoTutor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAdmins(await fetchAdmins())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admins')
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void ensureLoaded()
    if (canManageTenant) void load()
    else setLoading(false)
  }, [ensureLoaded, canManageTenant, load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !isValidPhone(phone)) return
    setSaving(true)
    setError(null)
    try {
      await createAdmin({
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim() || undefined,
        centerIds: selectedBranches,
        alsoTutor,
      })
      setName('')
      setPhone('')
      setPassword('')
      setSelectedBranches([])
      setAlsoTutor(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin')
    } finally {
      setSaving(false)
    }
  }

  async function saveBranches(admin: OrgAdminUser, centerIds: string[]) {
    setSaving(true)
    setError(null)
    try {
      await setAdminBranches(admin.id, centerIds)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch access')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  if (!canManageTenant) {
    return (
      <>
        <PageHeader title="Admins" sub="Organization owner access is required to manage admins." />
        <AppCard>
          <p className="text-sm text-muted-foreground">
            Your account is scoped to assigned branches. Contact your organization owner to change admin access.
          </p>
        </AppCard>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Admins"
        sub={
          isPlatformSuperUser
            ? 'Managing this organization as platform super user — assign branch admins and organization owners.'
            : 'Add branch admins with phone-based login — email is generated as phone@gmail.com and the default password is the phone number. One person can also be a tutor and pick their portal at sign-in.'
        }
      />
      {isPlatformSuperUser && (
        <AppCard className="mb-4 border-indigo/30 bg-indigo/5">
          <p className="text-sm text-muted-foreground">
            You are signed in as a <strong className="text-foreground">platform super user</strong>, not as this
            organization&apos;s owner. Changes here affect the tenant only.
          </p>
        </AppCard>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</div>
      )}

      <AppCard className="mb-6">
        <h3 className="font-display font-semibold mb-4">Add admin</h3>
        <form onSubmit={(e) => void handleCreate(e)} className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
            />
          </label>
          <PhoneCredentialFields
            phone={phone}
            onPhoneChange={setPhone}
            password={password}
            onPasswordChange={setPassword}
            idPrefix="admin-create"
          />
          <fieldset className="sm:col-span-2">
            <legend className="text-xs text-muted-foreground mb-2">Branch access</legend>
            <div className="flex flex-wrap gap-2">
              {centers.map((c) => (
                <label key={c.id} className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(c.id)}
                    onChange={(e) =>
                      setSelectedBranches((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                      )
                    }
                  />
                  {formatCenterLabel(c)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={alsoTutor}
              onChange={(e) => setAlsoTutor(e.target.checked)}
            />
            Also grant tutor access (same login — user chooses admin or tutor portal at sign-in)
          </label>
          {isValidPhone(phone) && (
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Share with the new admin: sign in using{' '}
              <span className="font-medium text-foreground">{phoneToLoginEmail(phone)}</span> and password{' '}
              <span className="font-medium text-foreground">{resolvePassword(phone, password)}</span>.
            </p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving || !isValidPhone(phone)} className={`${btnClass.primary} text-sm px-4 py-2`}>
              {saving ? 'Saving…' : 'Create admin'}
            </button>
          </div>
        </form>
      </AppCard>

      <AppCard>
        <h3 className="font-display font-semibold mb-4">Staff with admin access</h3>
        <div className="space-y-4">
          {admins.map((admin) => (
            <div key={admin.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {admin.isOwner ? 'Organization owner · all branches' : 'Branch admin'}
                    {admin.roles?.includes('tutor') && ' · also tutor'}
                  </p>
                  {admin.roles && admin.roles.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Portals:{' '}
                      {admin.roles
                        .map((role) => (role === 'admin' ? (admin.isOwner ? 'Organization Admin' : 'Branch Admin') : 'Tutor'))
                        .join(', ')}
                    </p>
                  )}
                </div>
                {!admin.isOwner && (
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === admin.id ? null : admin.id)}
                    className={`${btnClass.secondary} text-xs px-3 py-1.5`}
                  >
                    {editingId === admin.id ? 'Close' : 'Edit branches'}
                  </button>
                )}
              </div>
              {!admin.isOwner && editingId !== admin.id && (
                <p className="text-sm mt-3 text-muted-foreground">
                  Branches:{' '}
                  {admin.centerIds.length
                    ? admin.centerIds
                        .map((id) => formatCenterLabel(centers.find((c) => c.id === id) ?? { name: id, city: '' }))
                        .join(', ')
                    : 'None assigned'}
                </p>
              )}
              {!admin.isOwner && editingId === admin.id && (
                <BranchEditor
                  centers={centers}
                  initial={admin.centerIds}
                  saving={saving}
                  onSave={(ids) => void saveBranches(admin, ids)}
                />
              )}
            </div>
          ))}
        </div>
      </AppCard>
    </>
  )
}

function BranchEditor({
  centers,
  initial,
  saving,
  onSave,
}: {
  centers: { id: string; name: string; city: string }[]
  initial: string[]
  saving: boolean
  onSave: (ids: string[]) => void
}) {
  const [selected, setSelected] = useState(initial)
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {centers.map((c) => (
          <label key={c.id} className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5">
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={(e) =>
                setSelected((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
              }
            />
            {formatCenterLabel(c)}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => onSave(selected)}
        className={`${btnClass.primary} text-xs px-3 py-1.5`}
      >
        Save branch access
      </button>
    </div>
  )
}
