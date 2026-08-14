import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Pencil, Mail, Users, User, TrendingUp, BookOpen, Award } from 'lucide-react'
import { ActionMenu, ActionMenuItem } from '@/components/ui/ActionMenu'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { AppModal } from '@/components/ui/AppModal'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { createTutor, fetchTutors, updateTutor, type TutorAccount } from '@/lib/api/teachersApi'
import type { TeacherRow } from '@/lib/api/analyticsApi'
import { PhoneCredentialFields } from '@/components/auth/PhoneCredentialFields'
import { isValidPhone, phoneToLoginEmail, resolvePassword } from '@/lib/phoneAuth'
import { formatCenterLabel } from '@/lib/centerLabel'

const inputClass = 'mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background'
const primaryBtnClass =
  'inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-60'

function mergeTeachers(accounts: TutorAccount[], analytics: TeacherRow[]) {
  const byId = new Map(analytics.map((row) => [row.id, row]))
  return accounts.map((account) => {
    const stats = byId.get(account.id)
    return {
      ...account,
      subject: stats?.subject ?? '—',
      students: stats?.students ?? 0,
      improved: stats?.improved ?? 0,
      growth: stats?.growth ?? 0,
      readiness: stats?.readiness ?? 0,
    }
  })
}

export function AdminTeachersPage() {
  useAnalyticsPage('adminTeachers')
  const { centers, canManageTenant } = useCenters()
  const { teachers, loading, refresh } = useAnalytics()
  const [accounts, setAccounts] = useState<TutorAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TutorAccount | null>(null)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [alsoAdmin, setAlsoAdmin] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState<(TutorAccount & { subject: string; students: number; improved: number; growth: number; readiness: number }) | null>(null)

  async function loadAccounts() {
    setAccountsLoading(true)
    try {
      setAccounts(await fetchTutors())
    } catch {
      setAccounts([])
    } finally {
      setAccountsLoading(false)
    }
  }

  useEffect(() => {
    void loadAccounts()
  }, [])

  const rows = useMemo(() => mergeTeachers(accounts, teachers), [accounts, teachers])

  const totalStudents = useMemo(
    () => rows.reduce((sum, row) => sum + row.students, 0),
    [rows],
  )
  const avgGrowth =
    rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.growth, 0) / rows.length) : null

  function openCreate() {
    setEditing(null)
    setFormName('')
    setFormPhone('')
    setFormPassword('')
    setFormEmail('')
    setAlsoAdmin(false)
    setSelectedBranches([])
    setError(null)
    setShowForm(true)
  }

  function openEdit(tutor: TutorAccount) {
    setEditing(tutor)
    setFormName(tutor.name)
    setFormEmail(tutor.email)
    setError(null)
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateTutor(editing.id, { name: formName.trim(), email: formEmail.trim() })
      } else {
        if (!isValidPhone(formPhone)) {
          setError('Enter a valid 10-digit phone number.')
          return
        }
        await createTutor({
          name: formName.trim(),
          phone: formPhone.trim(),
          password: formPassword.trim() || undefined,
          alsoAdmin: alsoAdmin || undefined,
          centerIds: alsoAdmin ? selectedBranches : undefined,
        })
      }
      await Promise.all([loadAccounts(), refresh('adminTeachers')])
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tutor')
    } finally {
      setSaving(false)
    }
  }

  if (loading && teachers.length === 0 && accountsLoading) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow="Institute team"
        title="Teachers"
        sub="Add and manage tutor accounts, then review their impact on student outcomes."
        actions={
          <button type="button" onClick={openCreate} className={primaryBtnClass}>
            <Plus className="w-4 h-4" />
            Add tutor
          </button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <AppStat label="Tutors" value={rows.length} hint="Active tutor accounts" />
        <AppStat label="Students taught" value={totalStudents} tone="leaf" />
        <AppStat
          label="Avg score growth"
          value={avgGrowth ?? '—'}
          unit={avgGrowth != null ? '%' : undefined}
          tone="accent"
        />
      </div>

      <AppCard className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg text-foreground">Team management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tutors sign in with phone@gmail.com. Default password is the phone number unless you set another.
            </p>
          </div>
          {rows.length > 0 && (
            <button type="button" onClick={openCreate} className={primaryBtnClass}>
              <Plus className="w-4 h-4" />
              Add tutor
            </button>
          )}
        </div>

        {accountsLoading ? (
          <PageLoader label="Loading tutors…" />
        ) : rows.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground mb-4">
              No tutors yet. Add your first tutor to get started.
            </p>
            <button type="button" onClick={openCreate} className={primaryBtnClass}>
              <Plus className="w-4 h-4" />
              Add tutor
            </button>
          </div>
        ) : (
          <ResponsiveTable minWidth={560}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Focus</th>
                  <th className="pb-3 font-medium text-right">Students</th>
                  <th className="pb-3 font-medium text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tutor) => (
                  <tr key={tutor.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="py-3.5 font-medium">{tutor.name}</td>
                    <td className="py-3.5 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {tutor.email}
                      </span>
                    </td>
                    <td className="py-3.5 text-muted-foreground text-xs">{tutor.subject}</td>
                    <td className="py-3.5 text-right font-mono-data">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {tutor.students}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <ActionMenu label={`Actions for ${tutor.name}`}>
                        <ActionMenuItem onSelect={() => setViewingProfile(tutor)}>
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          View profile
                        </ActionMenuItem>
                        <ActionMenuItem onSelect={() => openEdit(tutor)}>
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          Edit
                        </ActionMenuItem>
                      </ActionMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </AppCard>

      <AppCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg text-foreground">Impact analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Effectiveness from assessments, marks, and student improvement under each tutor.
          </p>
        </div>
        {loading && teachers.length === 0 ? (
          <div className="p-5">
            <PageLoader label="Loading analytics…" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">Add tutors to see impact metrics.</p>
        ) : (
          <ResponsiveTable minWidth={720}>
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">Teacher</th>
                  <th className="text-left px-5 py-3">Subject · Board</th>
                  <th className="text-right px-5 py-3">Students</th>
                  <th className="text-right px-5 py-3">Improved %</th>
                  <th className="text-right px-5 py-3">Score growth</th>
                  <th className="text-right px-5 py-3">Avg readiness</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-5 py-4 font-medium">{t.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{t.subject}</td>
                    <td className="px-5 py-4 text-right font-mono-data">{t.students}</td>
                    <td className="px-5 py-4 text-right font-mono-data">{t.improved}%</td>
                    <td className="px-5 py-4 text-right font-mono-data text-leaf">
                      {t.growth > 0 ? '+' : ''}{t.growth}%
                    </td>
                    <td className="px-5 py-4 text-right font-mono-data text-accent">{t.readiness}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </AppCard>

      {/* Teacher profile modal */}
      <AppModal
        open={Boolean(viewingProfile)}
        onClose={() => setViewingProfile(null)}
        title={viewingProfile?.name ?? ''}
        description={viewingProfile?.email}
        size="md"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <button
              type="button"
              onClick={() => {
                if (viewingProfile) openEdit(viewingProfile)
                setViewingProfile(null)
              }}
              className="text-sm px-4 py-2 rounded-md border border-border hover:bg-secondary/60 transition-colors inline-flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit tutor
            </button>
            <button
              type="button"
              onClick={() => setViewingProfile(null)}
              className="text-sm px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90"
            >
              Close
            </button>
          </div>
        }
      >
        {viewingProfile && (
          <div className="space-y-5">
            {/* Avatar + basic info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                <span className="text-xl font-display text-accent">
                  {viewingProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg text-foreground truncate">{viewingProfile.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {viewingProfile.email}
                </p>
                {viewingProfile.subject && viewingProfile.subject !== '—' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <BookOpen className="w-3 h-3 shrink-0" />
                    {viewingProfile.subject}
                  </p>
                )}
              </div>
            </div>

            {/* Impact stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Students</p>
                <p className="text-2xl font-display text-foreground mt-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  {viewingProfile.students}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Improved</p>
                <p className="text-2xl font-display text-foreground mt-1 flex items-center gap-2">
                  <Award className="w-4 h-4 text-leaf" />
                  {viewingProfile.improved}%
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Score growth</p>
                <p className={`text-2xl font-display mt-1 flex items-center gap-2 ${
                  viewingProfile.growth >= 0 ? 'text-leaf' : 'text-rose'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  {viewingProfile.growth > 0 ? '+' : ''}{viewingProfile.growth}%
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Avg readiness</p>
                <p className="text-2xl font-display text-accent mt-1">
                  {viewingProfile.readiness}%
                </p>
              </div>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit tutor' : 'Add tutor'}
        description={
          editing ? editing.email : 'Phone becomes the login email (phone@gmail.com). Password defaults to the phone number.'
        }
        size="md"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="tutor-form"
              disabled={saving}
              className="text-sm px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add tutor'}
            </button>
          </div>
        }
      >
        <form id="tutor-form" onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Full name *</span>
            <input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={inputClass}
              placeholder="Priya Sharma"
            />
          </label>
          {editing ? (
            <label className="block">
              <span className="text-xs text-muted-foreground">Login email *</span>
              <input
                required
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className={inputClass}
              />
            </label>
          ) : (
            <>
              <PhoneCredentialFields
                phone={formPhone}
                onPhoneChange={setFormPhone}
                password={formPassword}
                onPasswordChange={setFormPassword}
                idPrefix="tutor-create"
              />
              {isValidPhone(formPhone) && (
                <p className="text-xs text-muted-foreground">
                  Login: {phoneToLoginEmail(formPhone)} · Password: {resolvePassword(formPhone, formPassword)}
                </p>
              )}
              {canManageTenant && (
                <>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={alsoAdmin}
                      onChange={(e) => setAlsoAdmin(e.target.checked)}
                    />
                    Also grant branch admin access (same login — user picks admin or tutor portal)
                  </label>
                  {alsoAdmin && (
                    <fieldset>
                      <legend className="text-xs text-muted-foreground mb-2">Branch access for admin portal</legend>
                      <div className="flex flex-wrap gap-2">
                        {centers.map((c) => (
                          <label
                            key={c.id}
                            className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5"
                          >
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
                  )}
                </>
              )}
            </>
          )}
          {error && <p className="text-sm text-rose">{error}</p>}
        </form>
      </AppModal>
    </>
  )
}
