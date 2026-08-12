import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Mail, Pencil, Upload, Users } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { AppModal } from '@/components/ui/AppModal'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { btnClass } from '@/components/ui/Button'
import { PhoneCredentialFields } from '@/components/auth/PhoneCredentialFields'
import { useCenters } from '@/hooks/useCenters'
import { useAuth } from '@/hooks/useAuth'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import type { TeacherRow } from '@/lib/api/analyticsApi'
import {
  createStaff,
  fetchStaff,
  setStaffBranches,
  updateStaff,
  type StaffMember,
} from '@/lib/api/staffApi'
import { formatCenterLabel } from '@/lib/centerLabel'
import { isValidPhone, phoneToLoginEmail, resolvePassword } from '@/lib/phoneAuth'
import {
  bulkImportStaff,
  downloadStaffImportTemplate,
  type StaffBulkRowPayload,
} from '@/lib/api/importsApi'
import { BulkCsvUploadModal } from '@/components/ui/BulkCsvUploadModal'
import { staffRowsFromCsv } from '@/lib/csvParse'

const inputClass = 'mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background'

function staffRoleSummary(staff: StaffMember): string {
  const parts: string[] = []
  if (staff.isOwner) parts.push('Organization owner')
  if (staff.roles.includes('admin') && (!staff.isOwner || staff.centerIds.length > 0)) {
    parts.push('Branch admin')
  }
  if (staff.roles.includes('tutor')) parts.push('Tutor')
  return parts.join(' · ') || 'Staff'
}

function mergeTutorAnalytics(staff: StaffMember[], analytics: TeacherRow[]) {
  const byId = new Map(analytics.map((row) => [row.id, row]))
  return staff
    .filter((member) => member.roles.includes('tutor'))
    .map((member) => {
      const stats = byId.get(member.id)
      return {
        ...member,
        subject: stats?.subject ?? '—',
        students: stats?.students ?? 0,
        improved: stats?.improved ?? 0,
        growth: stats?.growth ?? 0,
        readiness: stats?.readiness ?? 0,
      }
    })
}

export function AdminStaffPage() {
  useAnalyticsPage('adminTeachers')
  const { user, refreshAuth } = useAuth()
  const { organizationScoped } = useAdminPortalContext()
  const { centers, isPlatformSuperUser, ensureLoaded, refresh: refreshCenters } = useCenters()
  const { teachers, loading: analyticsLoading, refresh } = useAnalytics()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [isBranchAdmin, setIsBranchAdmin] = useState(false)
  const [isTutor, setIsTutor] = useState(true)
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editMember, setEditMember] = useState<StaffMember | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editIsOwner, setEditIsOwner] = useState(false)
  const [editIsBranchAdmin, setEditIsBranchAdmin] = useState(false)
  const [editIsTutor, setEditIsTutor] = useState(false)
  const [editBranches, setEditBranches] = useState<string[]>([])
  const [editError, setEditError] = useState<string | null>(null)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStaff(await fetchStaff())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load staff')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void ensureLoaded()
    void load()
  }, [ensureLoaded, load])

  const tutorRows = useMemo(() => mergeTutorAnalytics(staff, teachers), [staff, teachers])
  const totalStudents = useMemo(() => tutorRows.reduce((sum, row) => sum + row.students, 0), [tutorRows])
  const avgGrowth =
    tutorRows.length > 0 ? Math.round(tutorRows.reduce((sum, row) => sum + row.growth, 0) / tutorRows.length) : null

  const showBranchPicker = isBranchAdmin || isTutor
  const editShowBranchPicker = editIsBranchAdmin || editIsTutor
  const canPromoteOrgOwner = organizationScoped
  const canManageStaffRoles = organizationScoped
  const canAssignBranches = true

  function resetCreateForm() {
    setName('')
    setPhone('')
    setPassword('')
    setIsOwner(false)
    setIsBranchAdmin(false)
    setIsTutor(true)
    setSelectedBranches([])
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !isValidPhone(phone)) return
    if (!isTutor && !isBranchAdmin && !isOwner) {
      setError('Select at least one role.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createStaff({
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim() || undefined,
        isOwner: canPromoteOrgOwner ? isOwner : false,
        isBranchAdmin: isBranchAdmin || (canPromoteOrgOwner && isOwner),
        isTutor,
        centerIds: showBranchPicker ? selectedBranches : undefined,
      })
      resetCreateForm()
      await Promise.all([load(), refresh('adminTeachers')])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add staff')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(member: StaffMember) {
    setEditMember(member)
    setEditName(member.name)
    setEditEmail(member.email)
    setEditIsOwner(member.isOwner)
    setEditIsBranchAdmin(member.roles.includes('admin'))
    setEditIsTutor(member.roles.includes('tutor'))
    setEditBranches(member.centerIds)
    setEditError(null)
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!editMember) return
    if (!editIsTutor && !editIsBranchAdmin && !editIsOwner) {
      setEditError('Select at least one role.')
      return
    }
    setSaving(true)
    setEditError(null)
    try {
      await updateStaff(editMember.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        ...(canManageStaffRoles
          ? {
              isOwner: editIsOwner,
              isBranchAdmin: editIsBranchAdmin || editIsOwner,
              isTutor: editIsTutor,
            }
          : {
              isBranchAdmin: editIsBranchAdmin,
              isTutor: editIsTutor,
            }),
        ...(canAssignBranches && editShowBranchPicker ? { centerIds: editBranches } : {}),
      })
      const editedSelf = editMember.id === user.id
      setEditOpen(false)
      setEditMember(null)
      if (editedSelf) {
        await Promise.all([refreshAuth(), refreshCenters()])
      }
      await Promise.all([load(), refresh('adminTeachers')])
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update staff')
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    await saveEdit()
  }

  async function saveInlineBranches(member: StaffMember, centerIds: string[]) {
    setSaving(true)
    setError(null)
    try {
      await setStaffBranches(member.id, centerIds)
      setEditingId(null)
      if (member.id === user.id) {
        await Promise.all([refreshAuth(), refreshCenters()])
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch access')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <>
      <PageHeader
        title="Staff"
        sub={
          isPlatformSuperUser
            ? 'Manage organization owners, branch admins, and tutors in one place.'
            : organizationScoped
              ? 'Manage organization owners, branch admins, and tutors. Assign roles and branch access across the organization.'
              : 'Add tutors and branch admins within your assigned branches. Switch to Organization Admin to manage organization owners.'
        }
      />

      {isPlatformSuperUser && (
        <AppCard className="mb-4 border-indigo/30 bg-indigo/5">
          <p className="text-sm text-muted-foreground">
            You are signed in as a <strong className="text-foreground">platform super user</strong>, not as this
            organization&apos;s owner.
          </p>
        </AppCard>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <AppStat label="Staff" value={staff.length} hint="Admins and tutors" />
        <AppStat label="Tutors" value={tutorRows.length} tone="leaf" />
        <AppStat
          label="Students taught"
          value={totalStudents}
          unit={avgGrowth != null ? ` · avg growth ${avgGrowth}%` : undefined}
          tone="accent"
        />
      </div>

      <AppCard className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-semibold">Add staff</h3>
          <button
            type="button"
            onClick={() => setBulkUploadOpen(true)}
            className={`${btnClass.secondary} text-sm px-4 py-2 inline-flex items-center gap-2`}
          >
            <Upload className="w-4 h-4" />
            Bulk upload
          </button>
        </div>
        <form onSubmit={(e) => void handleCreate(e)} className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </label>
          <PhoneCredentialFields
            phone={phone}
            onPhoneChange={setPhone}
            password={password}
            onPasswordChange={setPassword}
            idPrefix="staff-create"
          />

          <fieldset className="sm:col-span-2">
            <legend className="text-xs text-muted-foreground mb-2">Roles</legend>
            <div className="flex flex-wrap gap-4">
              {canPromoteOrgOwner && (
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isOwner}
                    onChange={(e) => setIsOwner(e.target.checked)}
                  />
                  Organization owner
                </label>
              )}
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isBranchAdmin || isOwner}
                  onChange={(e) => setIsBranchAdmin(e.target.checked)}
                />
                Branch admin
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isTutor} onChange={(e) => setIsTutor(e.target.checked)} />
                Tutor
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Organization owner and branch admin can both be enabled — owners get all branches; branch assignments
              apply when signing in as Branch Admin. Same login also supports tutor portal.
            </p>
          </fieldset>

          {showBranchPicker && (
            <fieldset className="sm:col-span-2">
              <legend className="text-xs text-muted-foreground mb-2">Branch access</legend>
              <p className="text-xs text-muted-foreground mb-2">
                Scopes admin and tutor work. Organization owners ignore this when using the Organization Admin portal.
              </p>
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

          {isValidPhone(phone) && (
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Login: <span className="font-medium text-foreground">{phoneToLoginEmail(phone)}</span> · Password:{' '}
              <span className="font-medium text-foreground">{resolvePassword(phone, password)}</span>
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving || !isValidPhone(phone)}
              className={`${btnClass.primary} text-sm px-4 py-2`}
            >
              {saving ? 'Saving…' : 'Add staff'}
            </button>
          </div>
        </form>
      </AppCard>

      <AppCard className="mb-6">
        <h3 className="font-display font-semibold mb-4">Team roster</h3>
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff yet.</p>
        ) : (
          <div className="space-y-4">
            {staff.map((member) => (
              <div key={member.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{staffRoleSummary(member)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      className={`${btnClass.secondary} text-xs px-3 py-1.5 inline-flex items-center gap-1`}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    {canAssignBranches && !member.isOwner && (
                      <button
                        type="button"
                        onClick={() => setEditingId(editingId === member.id ? null : member.id)}
                        className={`${btnClass.secondary} text-xs px-3 py-1.5`}
                      >
                        {editingId === member.id ? 'Close branches' : 'Edit branches'}
                      </button>
                    )}
                  </div>
                </div>

                {!member.isOwner && editingId !== member.id && (
                  <p className="text-sm mt-3 text-muted-foreground">
                    Branches:{' '}
                    {member.centerIds.length
                      ? member.centerIds
                          .map((id) => formatCenterLabel(centers.find((c) => c.id === id) ?? { name: id, city: '' }))
                          .join(', ')
                      : member.roles.includes('tutor') && !member.roles.includes('admin')
                        ? 'All branches (tutor)'
                        : 'None assigned'}
                  </p>
                )}

                {canAssignBranches && !member.isOwner && editingId === member.id && (
                  <BranchEditor
                    centers={centers}
                    initial={member.centerIds}
                    saving={saving}
                    onSave={(ids) => void saveInlineBranches(member, ids)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </AppCard>

      {tutorRows.length > 0 && (
        <AppCard>
          <div className="px-1 pb-4 border-b border-border mb-4">
            <h3 className="font-display text-lg text-foreground">Tutor impact</h3>
            <p className="text-sm text-muted-foreground mt-1">Outcomes from assessments and student improvement.</p>
          </div>
          {analyticsLoading && teachers.length === 0 ? (
            <PageLoader label="Loading analytics…" />
          ) : (
            <ResponsiveTable minWidth={720}>
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3">Tutor</th>
                    <th className="text-left px-5 py-3">Focus</th>
                    <th className="text-right px-5 py-3">Students</th>
                    <th className="text-right px-5 py-3">Improved %</th>
                    <th className="text-right px-5 py-3">Avg growth</th>
                  </tr>
                </thead>
                <tbody>
                  {tutorRows.map((row) => (
                    <tr key={row.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="px-5 py-4 font-medium">{row.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.subject}</td>
                      <td className="px-5 py-4 text-right font-mono-data">
                        <span className="inline-flex items-center gap-1 justify-end">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {row.students}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono-data">{row.improved}%</td>
                      <td className="px-5 py-4 text-right font-mono-data text-leaf">+{row.growth}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </AppCard>
      )}

      <AppModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit staff"
        description={editMember?.email}
        size="md"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="text-sm px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveEdit()}
              disabled={saving}
              className="text-sm px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        <form id="staff-edit-form" onSubmit={(e) => void handleEditSubmit(e)} className="space-y-4">
          {editError && (
            <div className="rounded-lg border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-rose">{editError}</div>
          )}
          <label className="block">
            <span className="text-xs text-muted-foreground">Full name</span>
            <input required value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Login email</span>
            <input
              required
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          {canManageStaffRoles && (
            <>
              <fieldset>
                <legend className="text-xs text-muted-foreground mb-2">Roles</legend>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editIsOwner}
                      onChange={(e) => setEditIsOwner(e.target.checked)}
                    />
                    Organization owner
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editIsBranchAdmin || editIsOwner}
                      onChange={(e) => setEditIsBranchAdmin(e.target.checked)}
                    />
                    Branch admin
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editIsTutor}
                      onChange={(e) => setEditIsTutor(e.target.checked)}
                    />
                    Tutor
                  </label>
                </div>
              </fieldset>

              {editShowBranchPicker && (
                <fieldset>
                  <legend className="text-xs text-muted-foreground mb-2">Branch access</legend>
                  <p className="text-xs text-muted-foreground mb-2">
                    Used when signing in as Branch Admin or Tutor. Organization Admin portal always sees all branches.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {centers.map((c) => (
                      <label
                        key={c.id}
                        className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={editBranches.includes(c.id)}
                          onChange={(e) =>
                            setEditBranches((prev) =>
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

          {!canManageStaffRoles && (
            <fieldset>
              <legend className="text-xs text-muted-foreground mb-2">Roles</legend>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editIsBranchAdmin}
                    onChange={(e) => setEditIsBranchAdmin(e.target.checked)}
                  />
                  Branch admin
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editIsTutor} onChange={(e) => setEditIsTutor(e.target.checked)} />
                  Tutor
                </label>
              </div>
            </fieldset>
          )}

          {!canManageStaffRoles && !editIsOwner && (
            <fieldset>
              <legend className="text-xs text-muted-foreground mb-2">Branch access</legend>
              <div className="flex flex-wrap gap-2">
                {centers.map((c) => (
                  <label
                    key={c.id}
                    className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={editBranches.includes(c.id)}
                      onChange={(e) =>
                        setEditBranches((prev) =>
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

        </form>
      </AppModal>

      <BulkCsvUploadModal<StaffBulkRowPayload>
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        title="Bulk upload staff"
        description="Import branch admins and tutors from CSV. Organization owner column appears only in Organization Admin portal."
        columnsHelp={
          organizationScoped
            ? [
                'name — full name (required)',
                'phone — 10-digit mobile (required)',
                'branch_admin — yes/no',
                'tutor — yes/no',
                'org_owner — yes/no (Organization Admin only)',
                'branches — branch names separated by ; or ,',
                'password — optional custom password',
              ]
            : [
                'name — full name (required)',
                'phone — 10-digit mobile (required)',
                'branch_admin — yes/no',
                'tutor — yes/no',
                'branches — branch names separated by ; or ,',
                'password — optional custom password',
              ]
        }
        mapRows={(rows) =>
          staffRowsFromCsv(rows).map((row) => ({
            name: row.name,
            phone: row.phone,
            isOwner: organizationScoped ? row.isOwner : false,
            isBranchAdmin: row.isBranchAdmin,
            isTutor: row.isTutor,
            centerNames: row.centerNames,
            password: row.password,
          }))
        }
        validateRow={(row) => {
          if (!row.name.trim()) return 'Name is required'
          if (!isValidPhone(row.phone)) return 'Phone must be 10–15 digits'
          if (!row.isOwner && !row.isBranchAdmin && !row.isTutor) {
            return 'Select at least one role (branch_admin, tutor, or org_owner)'
          }
          if (row.isOwner && !organizationScoped) {
            return 'Organization owner can only be imported from Organization Admin portal'
          }
          return null
        }}
        previewRow={(row) => {
          const roles = [
            row.isOwner ? 'Organization owner' : null,
            row.isBranchAdmin ? 'Branch admin' : null,
            row.isTutor ? 'Tutor' : null,
          ]
            .filter(Boolean)
            .join(', ')
          const branches = row.centerNames?.length ? ` · ${row.centerNames.join(', ')}` : ''
          return `${row.name} · ${row.phone} · ${roles || 'No roles'}${branches}`
        }}
        onDownloadTemplate={downloadStaffImportTemplate}
        onImport={bulkImportStaff}
        onComplete={() => void Promise.all([load(), refresh('adminTeachers')])}
      />
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
