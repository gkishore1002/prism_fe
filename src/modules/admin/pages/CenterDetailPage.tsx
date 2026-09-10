import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { MapPin, Pencil, Users, Download } from 'lucide-react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { Pagination } from '@/components/ui/Pagination'
import { btnClass } from '@/components/ui/Button'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { fetchCenter, updateCenter } from '@/lib/api/institutionsApi'
import { fetchStudentsMasterPaginated } from '@/lib/api/studentsApi'
import { formatCenterLabel } from '@/lib/centerLabel'
import { isCscUrgent } from '@/lib/cscPolicy'
import { useInstitutionPolicies } from '@/hooks/useInstitutionPolicies'
import { DEFAULT_PAGE_LIMIT } from '@/lib/pagination'
import { exportCscComplianceCsv, exportStudentsCsv } from '@/lib/api/exportsApi'
import { useCenters } from '@/hooks/useCenters'
import { useAdminPortalContext } from '@/hooks/useAdminPortalContext'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import type { InstitutionCenter, StudentMasterProfile } from '@/types'

export function AdminCenterDetailPage() {
  const { centerId = '' } = useParams()
  const { canManageTenant, loading: centersLoading, ensureLoaded } = useCenters()
  const { organizationScoped } = useAdminPortalContext()
  const { activeYearId, activeYear } = useAcademicYears()
  useAnalyticsPage('adminCenters')
  const { centerAnalytics, refresh: refreshAnalytics } = useAnalytics()
  const { policies } = useInstitutionPolicies()

  const [center, setCenter] = useState<InstitutionCenter | null>(null)
  const [students, setStudents] = useState<StudentMasterProfile[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'students' | 'csc' | null>(null)

  const analytics = centerAnalytics.find((c) => c.id === centerId)
  const warningDays = policies?.csc.warningThresholdDays ?? 14
  const inactivityDays = policies?.csc.inactivityThresholdDays ?? 90

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const loadCenter = useCallback(async () => {
    if (!centerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCenter(centerId)
      setCenter(data)
      setEditName(data.name)
      setEditCity(data.city)
      setEditActive(data.active !== false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Center not found')
      setCenter(null)
    } finally {
      setLoading(false)
    }
  }, [centerId])

  const loadStudents = useCallback(async () => {
    if (!centerId || !activeYearId) return
    setStudentsLoading(true)
    try {
      const data = await fetchStudentsMasterPaginated({
        page,
        limit: DEFAULT_PAGE_LIMIT,
        center: centerId,
        search: debouncedSearch || undefined,
        academicYearId: activeYearId,
      })
      setStudents(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load students')
    } finally {
      setStudentsLoading(false)
    }
  }, [centerId, page, debouncedSearch, activeYearId])

  useEffect(() => {
    void loadCenter()
  }, [loadCenter])

  useEffect(() => {
    if (center) void loadStudents()
  }, [center, loadStudents])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!centerId) return
    setSaving(true)
    setSaveMessage(null)
    try {
      const updated = await updateCenter(centerId, {
        name: editName.trim(),
        city: editCity.trim(),
        active: editActive,
      })
      setCenter(updated)
      setEditing(false)
      setSaveMessage('Center updated.')
      await refreshAnalytics('adminCenters')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport(kind: 'students' | 'csc') {
    if (!centerId) return
    setExporting(kind)
    setError(null)
    try {
      if (kind === 'students') await exportStudentsCsv(centerId, activeYearId)
      else await exportCscComplianceCsv(centerId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  if (centersLoading) return <PageLoader />

  if (!organizationScoped || !canManageTenant) {
    return <Navigate to="/admin" replace />
  }

  if (loading) return <PageLoader />

  if (!center) {
    return (
      <>
        <AppCard>
          <p className="text-sm text-rose">{error ?? 'Center not found'}</p>
        </AppCard>
      </>
    )
  }

  const cscDueSoon = students.filter(
    (s) => s.status === 'active' && isCscUrgent(s.daysUntilCscDisable, warningDays),
  ).length
  const cscInactive = students.filter((s) => s.disableReason === 'csc_inactivity').length

  return (
    <>
      <PageHeader
        eyebrow="Branch"
        title={formatCenterLabel(center)}
        sub={`${center.city || 'City not set'} · Part of your institution network`}
        actions={
          !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`${btnClass.secondary} text-sm px-4 py-2 inline-flex items-center gap-2`}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : undefined
        }
      />

      {saveMessage && (
        <div className="mb-4 rounded-lg border border-leaf/30 bg-leaf/5 px-4 py-3 text-sm">{saveMessage}</div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</div>
      )}

      {editing ? (
        <AppCard className="mb-6">
          <form onSubmit={(e) => void handleSave(e)} className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-muted-foreground">Center name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">City</span>
              <input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                required
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2 text-sm">
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              Active — new students can be assigned to this branch
            </label>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className={`${btnClass.primary} text-sm px-4 py-2`}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditing(false)
                  setEditName(center.name)
                  setEditCity(center.city)
                  setEditActive(center.active !== false)
                }}
                className={`${btnClass.secondary} text-sm px-4 py-2`}
              >
                Cancel
              </button>
            </div>
          </form>
        </AppCard>
      ) : (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              center.active !== false ? 'bg-leaf/15 text-leaf' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {center.active !== false ? 'Active' : 'Inactive'}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" /> {center.city}
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppStat label="Students" value={center.studentCount} tone="accent" />
        <AppStat label="Avg score" value={analytics?.avg ?? '—'} unit={analytics ? '%' : undefined} tone="leaf" />
        <AppStat label="CSC due soon" value={cscDueSoon} hint={`Within ${warningDays} days`} />
        <AppStat label="CSC inactive" value={cscInactive} hint={`No visit in ${inactivityDays}+ days`} />
      </div>

      {analytics && (
        <AppCard className="mb-6">
          <h3 className="font-display font-semibold text-foreground mb-3">Branch performance</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Active students</p>
              <p className="font-medium">{analytics.retention}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. readiness</p>
              <p className="font-medium">{analytics.nps}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score growth</p>
              <p className="font-medium">{analytics.growth > 0 ? '+' : ''}{analytics.growth}%</p>
            </div>
          </div>
        </AppCard>
      )}

      <AppCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-foreground">Students at this branch</h3>
            <span className="text-xs text-muted-foreground">({total})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={exporting != null}
              onClick={() => void handleExport('students')}
              className={`${btnClass.secondary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5`}
            >
              <Download className="w-3.5 h-3.5" />
              {exporting === 'students' ? 'Exporting…' : 'Students CSV'}
            </button>
            <button
              type="button"
              disabled={exporting != null}
              onClick={() => void handleExport('csc')}
              className={`${btnClass.secondary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5`}
            >
              <Download className="w-3.5 h-3.5" />
              {exporting === 'csc' ? 'Exporting…' : 'CSC CSV'}
            </button>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="text-sm border border-border rounded-md px-3 py-1.5 bg-background w-full sm:w-56"
            />
          </div>
        </div>

        {studentsLoading && students.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">
            {activeYear
              ? `No students enrolled at this center for ${activeYear.name}.`
              : 'No students at this center yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-left px-5 py-3">Grade</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">CSC</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-5 py-3">
                      <Link to={`/admin/manage/students`} className="font-medium text-foreground hover:text-accent">
                        {s.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground font-mono-data">{s.id}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{s.grade}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs capitalize">{s.status}</span>
                      {s.disableReason === 'csc_inactivity' && (
                        <p className="text-[10px] text-rose">CSC inactive</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {s.daysUntilCscDisable != null ? (
                        <span
                          className={
                            isCscUrgent(s.daysUntilCscDisable, warningDays) ? 'text-rose text-xs' : 'text-xs text-muted-foreground'
                          }
                        >
                          {s.daysUntilCscDisable}d left
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No visit yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="px-5 py-4 border-t border-border">
            <Pagination
              page={page}
              pages={pages}
              total={total}
              limit={DEFAULT_PAGE_LIMIT}
              onPageChange={setPage}
            />
          </div>
        )}
      </AppCard>
    </>
  )
}
