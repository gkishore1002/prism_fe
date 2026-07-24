import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Pencil, Mail, Users } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { AppModal } from '@/components/ui/AppModal'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { createTutor, fetchTutors, updateTutor, type TutorAccount } from '@/lib/api/teachersApi'
import type { TeacherRow } from '@/lib/api/analyticsApi'

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
  const { teachers, loading, refresh } = useAnalytics()
  const [accounts, setAccounts] = useState<TutorAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TutorAccount | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setFormEmail('')
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
        await createTutor({ name: formName.trim(), email: formEmail.trim() })
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
          label="Avg growth"
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
              Tutors log in with their email. New accounts use the institute demo password until reset.
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
                      <button
                        type="button"
                        onClick={() => openEdit(tutor)}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
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
                  <th className="text-right px-5 py-3">Avg growth</th>
                  <th className="text-right px-5 py-3">Readiness lift</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-5 py-4 font-medium">{t.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{t.subject}</td>
                    <td className="px-5 py-4 text-right font-mono-data">{t.students}</td>
                    <td className="px-5 py-4 text-right font-mono-data">{t.improved}%</td>
                    <td className="px-5 py-4 text-right font-mono-data text-leaf">+{t.growth}%</td>
                    <td className="px-5 py-4 text-right font-mono-data text-accent">+{t.readiness}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </AppCard>

      <AppModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit tutor' : 'Add tutor'}
        description={editing ? editing.email : 'Create a tutor account for your institute'}
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
          <label className="block">
            <span className="text-xs text-muted-foreground">Email *</span>
            <input
              required
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className={inputClass}
              placeholder="priya@brightpath.edu"
            />
          </label>
          {!editing && (
            <p className="text-xs text-muted-foreground">
              Initial password is the institute demo password. The tutor can sign in immediately after creation.
            </p>
          )}
          {error && <p className="text-sm text-rose">{error}</p>}
        </form>
      </AppModal>
    </>
  )
}
