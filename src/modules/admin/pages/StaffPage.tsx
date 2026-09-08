import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Mail, Plus, Upload, Users, Search, Edit3, User, TrendingUp, BookOpen, Award, ShieldCheck } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { AppModal } from '@/components/ui/AppModal'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ActionMenu, ActionMenuItem } from '@/components/ui/ActionMenu'
import { btnClass } from '@/components/ui/Button'
import { PhoneCredentialFields } from '@/components/auth/PhoneCredentialFields'
import { useCenters } from '@/hooks/useCenters'
import { useAuth } from '@/hooks/useAuth'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import type { TeacherRow } from '@/lib/api/analyticsApi'
import {
  createStaff,
  fetchStaff,
  updateStaff,
  listStaffAssignments,
  upsertStaffAssignment,
  type StaffMember,
  type StaffAssignment,
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

export function AdminStaffPage({ embedded = false }: { embedded?: boolean }) {
  useAnalyticsPage('adminTeachers')
  const { user, refreshAuth } = useAuth()
  const { organizationScoped } = useAdminPortalContext()
  const { centers, isPlatformSuperUser, ensureLoaded, refresh: refreshCenters, activeCenterId, isAllBranches } = useCenters()
  const { activeYearId, activeYear } = useAcademicYears()
  const { teachers, loading: analyticsLoading, refresh } = useAnalytics()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [isBranchAdmin, setIsBranchAdmin] = useState(false)
  const [isTutor, setIsTutor] = useState(true)
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [assignmentCenterId, setAssignmentCenterId] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editMember, setEditMember] = useState<StaffMember | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editIsOwner, setEditIsOwner] = useState(false)
  const [editIsBranchAdmin, setEditIsBranchAdmin] = useState(false)
  const [editIsTutor, setEditIsTutor] = useState(false)
  const [editBranches, setEditBranches] = useState<string[]>([])
  const [editAssignmentCenterId, setEditAssignmentCenterId] = useState('')
  const [editAssignmentStatus, setEditAssignmentStatus] = useState('active')
  const [editError, setEditError] = useState<string | null>(null)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewingProfile, setViewingProfile] = useState<StaffMember | null>(null)
  const [assignmentHistory, setAssignmentHistory] = useState<StaffAssignment[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const branchCenterId = isAllBranches ? undefined : activeCenterId

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStaff(await fetchStaff(branchCenterId, activeYearId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load staff')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }, [branchCenterId, activeYearId])

  useEffect(() => {
    void ensureLoaded()
    void load()
  }, [ensureLoaded, load])

  useEffect(() => {
    if (!viewingProfile) {
      setAssignmentHistory([])
      return
    }
    let cancelled = false
    setHistoryLoading(true)
    void listStaffAssignments(viewingProfile.id)
      .then((rows) => {
        if (!cancelled) setAssignmentHistory(rows)
      })
      .catch(() => {
        if (!cancelled) setAssignmentHistory([])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [viewingProfile])
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const filteredStaff = useMemo(() => {
    if (!debouncedSearch) return staff
    const query = debouncedSearch.toLowerCase()
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query),
    )
  }, [staff, debouncedSearch])

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
    setAssignmentCenterId('')
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !isValidPhone(phone)) return
    if (!isTutor && !isBranchAdmin && !isOwner) {
      setError('Select at least one role.')
      return
    }
    const yearCenter =
      assignmentCenterId ||
      (showBranchPicker && selectedBranches.length > 0 ? selectedBranches[0] : '')
    if (!yearCenter) {
      setError('Select a center for this academic year’s assignment.')
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
        centerIds: showBranchPicker ? selectedBranches : [yearCenter],
        academicYearId: activeYearId,
        assignmentCenterId: yearCenter,
      })
      resetCreateForm()
      setShowAddForm(false)
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
    setEditAssignmentCenterId(member.assignmentCenterId ?? member.centerIds[0] ?? '')
    setEditAssignmentStatus(member.assignmentStatus ?? 'active')
    setEditError(null)
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!editMember) return
    if (!editIsTutor && !editIsBranchAdmin && !editIsOwner) {
      setEditError('Select at least one role.')
      return
    }
    if (!editAssignmentCenterId) {
      setEditError('Select a center for this academic year’s assignment.')
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
      if (activeYearId && editAssignmentCenterId) {
        await upsertStaffAssignment(editMember.id, activeYearId, {
          centerId: editAssignmentCenterId,
          status: editAssignmentStatus || 'active',
        })
      }
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

  if (loading) return <PageLoader />

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Staff"
          sub={
            isPlatformSuperUser
              ? 'Manage organization owners, branch admins, and tutors in one place.'
              : organizationScoped
                ? `Manage staff accounts and portal access. Academic placement follows the header year${activeYear ? ` (${activeYear.name})` : ''}.`
                : `Add tutors and branch admins within your assigned branches. List is filtered by academic year${activeYear ? ` (${activeYear.name})` : ''}.`
          }
        />
      )}

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-secondary/40 border border-border rounded-md px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="text-sm outline-none bg-transparent w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBulkUploadOpen(true)}
              className={`${btnClass.secondary} text-sm px-4 py-2 inline-flex items-center gap-2`}
            >
              <Upload className="w-4 h-4" />
              Bulk upload
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((open) => !open)}
              className={`${btnClass.primary} text-sm px-4 py-2 inline-flex items-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              Add staff
            </button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={(e) => void handleCreate(e)} className="grid sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
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
                <legend className="text-xs text-muted-foreground mb-2">Portal branch access</legend>
                <p className="text-xs text-muted-foreground mb-2">
                  Which centers this login can open. Separate from academic placement for the year.
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

            <label className="block sm:col-span-2">
              <span className="text-xs text-muted-foreground">
                Academic placement{activeYear ? ` · ${activeYear.name}` : ''}
              </span>
              <select
                value={assignmentCenterId}
                onChange={(e) => setAssignmentCenterId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select center for this year</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatCenterLabel(c)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Where this staff member is assigned academically for the selected year. Portal access can include more
                centers.
              </p>
            </label>
            {isValidPhone(phone) && (
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Login: <span className="font-medium text-foreground">{phoneToLoginEmail(phone)}</span> · Password:{' '}
                <span className="font-medium text-foreground">{resolvePassword(phone, password)}</span>
              </p>
            )}

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={saving || !isValidPhone(phone)}
                className={`${btnClass.primary} text-sm px-4 py-2`}
              >
                {saving ? 'Saving…' : 'Save staff'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetCreateForm()
                  setShowAddForm(false)
                }}
                className={`${btnClass.secondary} text-sm px-4 py-2`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {filteredStaff.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {debouncedSearch
              ? 'No staff found.'
              : activeYear
                ? `No staff assigned for ${activeYear.name} yet. Add staff or set this year’s placement.`
                : 'No staff yet.'}
          </p>
        ) : (
          <ResponsiveTable minWidth={620}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Staff</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">
                    {activeYear ? `${activeYear.name} center` : 'Year center'}
                  </th>
                  <th className="pb-3 font-medium">Portal branches</th>
                  <th className="pb-3 font-medium text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-secondary/30">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                        <Mail className="w-3 h-3 shrink-0" />
                        {member.email}
                      </p>
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">{staffRoleSummary(member)}</td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {member.assignmentCenterId
                        ? formatCenterLabel(
                            centers.find((c) => c.id === member.assignmentCenterId) ?? {
                              name: member.assignmentCenterId,
                              city: '',
                            },
                          )
                        : '—'}
                      {member.assignmentStatus && member.assignmentStatus !== 'active' ? (
                        <span className="ml-1 text-[10px] uppercase tracking-wide">
                          ({member.assignmentStatus})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {member.isOwner
                        ? 'All (owner)'
                        : member.centerIds.length
                          ? member.centerIds
                              .map((id) => formatCenterLabel(centers.find((c) => c.id === id) ?? { name: id, city: '' }))
                              .join(', ')
                          : member.roles.includes('tutor') && !member.roles.includes('admin')
                            ? 'All (tutor)'
                            : '—'}
                    </td>
                    <td className="py-3">
                      <ActionMenu label={`Actions for ${member.name}`}>
                        <ActionMenuItem onSelect={() => setViewingProfile(member)}>
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          View profile
                        </ActionMenuItem>
                        <ActionMenuItem onSelect={() => openEdit(member)}>
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
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
                      <td className="px-5 py-4 text-right font-mono-data text-leaf">
                        {row.growth > 0 ? '+' : ''}{row.growth}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </AppCard>
      )}

      {/* Staff profile modal */}
      <AppModal
        open={Boolean(viewingProfile)}
        onClose={() => setViewingProfile(null)}
        title={viewingProfile?.name ?? ''}
        description={viewingProfile ? staffRoleSummary(viewingProfile) : undefined}
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
              <Edit3 className="w-3.5 h-3.5" />
              Edit
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
        {viewingProfile && (() => {
          const tutorStats = tutorRows.find((r) => r.id === viewingProfile.id)
          return (
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
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    {staffRoleSummary(viewingProfile)}
                  </p>
                </div>
              </div>

              {/* Branches */}
              {!viewingProfile.isOwner && viewingProfile.centerIds.length > 0 && (
                <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Portal branch access</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingProfile.centerIds.map((id) => {
                      const center = centers.find((c) => c.id === id)
                      return (
                        <span key={id} className="text-xs border border-border rounded-md px-2 py-1 text-foreground">
                          {center ? formatCenterLabel(center) : id}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Academic year placements
                </p>
                {historyLoading ? (
                  <p className="text-xs text-muted-foreground">Loading history…</p>
                ) : assignmentHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No year assignments yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {assignmentHistory.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0"
                      >
                        <span className="font-medium text-foreground">
                          {row.academicYearName || row.academicYearId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCenterLabel(
                            centers.find((c) => c.id === row.centerId) ?? {
                              name: row.centerId,
                              city: '',
                            },
                          )}{' '}
                          · {row.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Tutor analytics if available */}
              {tutorStats && (
                <>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Tutor impact
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Students</p>
                      <p className="text-2xl font-display text-foreground mt-1 flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent" />
                        {tutorStats.students}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Improved</p>
                      <p className="text-2xl font-display text-foreground mt-1 flex items-center gap-2">
                        <Award className="w-4 h-4 text-leaf" />
                        {tutorStats.improved}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Score growth</p>
                      <p className={`text-2xl font-display mt-1 flex items-center gap-2 ${tutorStats.growth >= 0 ? 'text-leaf' : 'text-rose'}`}>
                        <TrendingUp className="w-4 h-4" />
                        {tutorStats.growth > 0 ? '+' : ''}{tutorStats.growth}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Avg readiness</p>
                      <p className="text-2xl font-display text-accent mt-1">
                        {tutorStats.readiness}%
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })()}
      </AppModal>

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
                  <legend className="text-xs text-muted-foreground mb-2">Portal branch access</legend>
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
              <legend className="text-xs text-muted-foreground mb-2">Portal branch access</legend>
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

          <fieldset>
            <legend className="text-xs text-muted-foreground mb-2">
              Academic placement{activeYear ? ` · ${activeYear.name}` : ''}
            </legend>
            <p className="text-xs text-muted-foreground mb-2">
              Center for the selected academic year only. Does not change prior years or portal access.
            </p>
            <label className="block mb-3">
              <span className="text-xs text-muted-foreground">Center</span>
              <select
                value={editAssignmentCenterId}
                onChange={(e) => setEditAssignmentCenterId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select center</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatCenterLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Status</span>
              <select
                value={editAssignmentStatus}
                onChange={(e) => setEditAssignmentStatus(e.target.value)}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="transferred">Transferred</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </fieldset>

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
