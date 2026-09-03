import { useState, useEffect, useCallback } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Link } from 'react-router-dom'
import { Plus, Search, FileText, Eye, Pencil, Upload } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppDropdown, AppSelectMulti } from '@/components/ui/AppDropdown'
import { ActionMenu, ActionMenuItem, ActionMenuLink } from '@/components/ui/ActionMenu'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { Pagination } from '@/components/ui/Pagination'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { createStudent, deleteStudent, updateStudentApi } from '@/lib/api/curriculumApi'
import { PhoneCredentialFields } from '@/components/auth/PhoneCredentialFields'
import { isValidPhone, phoneToLoginEmail, resolvePassword } from '@/lib/phoneAuth'
import { fetchStudentsMasterPaginated } from '@/lib/api/studentsApi'
import { fetchStudentTracking } from '@/lib/api/cscApi'
import { AppModal, useConfirmModal } from '@/components/ui/AppModal'
import { StudentProfileView } from '@/components/academic/StudentProfileView'
import { ReassignmentReviewModal } from '@/components/academic/ReassignmentReviewModal'
import { formatCenterLabel, centerLabelById } from '@/lib/centerLabel'
import { exportStudentsCsv } from '@/lib/api/exportsApi'
import {
  bulkImportStudents,
  downloadStudentsImportTemplate,
  type StudentBulkRowPayload,
} from '@/lib/api/importsApi'
import { BulkCsvUploadModal } from '@/components/ui/BulkCsvUploadModal'
import { studentRowsFromCsv } from '@/lib/csvParse'
import { DEFAULT_PAGE_LIMIT } from '@/lib/pagination'
import type { AssessmentAccessRequest, StudentMasterProfile, StudentTracking } from '@/types'

import type { InstitutionCenter } from '@/types'

interface StudentManagementPanelProps {
  scope: 'tutor' | 'admin'
}

function centerName(id: string | null | undefined, centers: InstitutionCenter[]) {
  if (!id) return '—'
  return centerLabelById(id, centers)
}

function batchLabels(student: StudentMasterProfile, batches: { id: string; name: string }[]) {
  if (student.batchIds?.length) {
    const resolved = student.batchIds
      .map((id) => batches.find((b) => b.id === id)?.name)
      .filter(Boolean) as string[]
    if (resolved.length) return resolved.join(', ')
  }
  return student.batch || '—'
}

interface StudentRowActionsProps {
  studentId: string
  studentName: string
  scope: 'tutor' | 'admin'
  onView: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function StudentRowActions({
  studentId,
  studentName,
  scope,
  onView,
  onEdit,
  onDelete,
}: StudentRowActionsProps) {
  return (
    <ActionMenu label={`Actions for ${studentName}`}>
      <ActionMenuItem onSelect={onView}>
        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        View
      </ActionMenuItem>
      {scope === 'admin' && onEdit && (
        <ActionMenuItem onSelect={onEdit}>
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          Edit
        </ActionMenuItem>
      )}
      {scope === 'admin' && (
        <ActionMenuLink to={`/admin/students/${studentId}/report`}>
          <FileText className="w-3.5 h-3.5 text-accent" />
          View report
        </ActionMenuLink>
      )}
      {scope === 'admin' && onDelete && (
        <ActionMenuItem className="text-rose" onSelect={onDelete}>
          Delete
        </ActionMenuItem>
      )}
    </ActionMenu>
  )
}

export function StudentManagementPanel({ scope }: StudentManagementPanelProps) {
  useAnalyticsPage('adminStudents')
  const { batches: tutorBatches, curriculum, refresh: refreshCurriculum, ensureLoaded: ensureCurriculumLoaded } =
    useCurriculum()
  const { confirm } = useConfirmModal()
  const { centers, activeCenterId, isAllBranches, ensureLoaded: ensureCentersLoaded } = useCenters()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewingStudent, setViewingStudent] = useState<StudentMasterProfile | null>(null)
  const [studentTracking, setStudentTracking] = useState<StudentTracking | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [reviewRequest, setReviewRequest] = useState<AssessmentAccessRequest | null>(null)
  const [exporting, setExporting] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentMasterProfile | null>(null)
  const [editName, setEditName] = useState('')
  const [editCenter, setEditCenter] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [list, setList] = useState<StudentMasterProfile[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const boards = curriculum.map((b) => b.board)
  const [formBoard, setFormBoard] = useState(boards[0] ?? 'CBSE')
  const [formGrade, setFormGrade] = useState('8')
  const [formBatch, setFormBatch] = useState(tutorBatches[0]?.id ?? '')
  const [formCenter, setFormCenter] = useState('')
  const [editBatchIds, setEditBatchIds] = useState<string[]>([])
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')

  useEffect(() => {
    void ensureCurriculumLoaded()
  }, [ensureCurriculumLoaded])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const effectiveCenter =
    !isAllBranches && activeCenterId
      ? activeCenterId
      : centerFilter === 'all'
        ? undefined
        : centerFilter

  useEffect(() => {
    void ensureCentersLoaded()
  }, [ensureCentersLoaded])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, effectiveCenter])

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await fetchStudentsMasterPaginated({
        page,
        limit,
        search: debouncedSearch || undefined,
        center: effectiveCenter,
      })
      setList(data.items)
      setTotal(data.total)
      setPages(data.pages)
      if (data.items.length === 0 && data.total > 0 && page > 1) {
        setPage(data.pages)
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load students')
      setList([])
      setTotal(0)
      setPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, effectiveCenter])

  useEffect(() => {
    void loadStudents()
  }, [loadStudents])

  useEffect(() => {
    if (!viewingStudent) {
      setStudentTracking(null)
      setTrackingLoading(false)
      setTrackingError(null)
      return
    }
    let cancelled = false
    setTrackingLoading(true)
    setTrackingError(null)
    void fetchStudentTracking(viewingStudent.id)
      .then((data) => {
        if (!cancelled) setStudentTracking(data)
      })
      .catch((e) => {
        if (!cancelled) {
          setStudentTracking(null)
          setTrackingError(e instanceof Error ? e.message : 'Failed to load activity history')
        }
      })
      .finally(() => {
        if (!cancelled) setTrackingLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [viewingStudent])

  async function handleExportStudents() {
    setExporting(true)
    try {
      await exportStudentsCsv()
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function refreshProfileAfterReview() {
    if (!viewingStudent) return
    const [tracking, listData] = await Promise.all([
      fetchStudentTracking(viewingStudent.id),
      fetchStudentsMasterPaginated({
        page,
        limit,
        search: debouncedSearch || undefined,
        center: effectiveCenter,
      }),
    ])
    setStudentTracking(tracking)
    const refreshed = listData.items.find((s) => s.id === viewingStudent.id)
    if (refreshed) setViewingStudent(refreshed)
    await loadStudents()
  }

  useEffect(() => {
    if (centers[0] && !formCenter) setFormCenter(centers[0].id)
  }, [centers, formCenter])

  const [formPhone, setFormPhone] = useState('')
  const [formPassword, setFormPassword] = useState('')

  const [saving, setSaving] = useState(false)

  async function refreshAfterMutation() {
    await refreshCurriculum()
    await loadStudents()
  }

  async function handleAddStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isValidPhone(formPhone)) return
    const form = new FormData(e.currentTarget)
    setSaving(true)
    try {
      await createStudent({
        name: String(form.get('name') || ''),
        board: String(form.get('board') || 'CBSE'),
        grade: `Grade ${String(form.get('grade') || '8')}`,
        batchId: String(form.get('batchId') || formBatch),
        centerId: String(form.get('centerId') || formCenter),
        academicYear: String(form.get('academicYear') || '2025-26'),
        phone: formPhone.trim(),
        password: formPassword.trim() || undefined,
        schoolName: String(form.get('schoolName') || '') || undefined,
      })
      await refreshAfterMutation()
      setShowForm(false)
      setFormPhone('')
      setFormPassword('')
      setPage(1)
      e.currentTarget.reset()
    } finally {
      setSaving(false)
    }
  }

  function startEdit(student: StudentMasterProfile) {
    setEditingStudent(student)
    setEditName(student.name)
    setEditBatchIds(
      student.batchIds?.length
        ? student.batchIds
        : tutorBatches.filter((b) => b.studentIds.includes(student.id)).map((b) => b.id),
    )
    setEditCenter(student.centerId ?? '')
    setEditStatus(student.status)
  }

  async function handleSaveEdit() {
    if (!editingStudent) return
    setSaving(true)
    try {
      await updateStudentApi(editingStudent.id, {
        name: editName.trim(),
        batchIds: editBatchIds,
        centerId: editCenter,
        status: editStatus,
      })
      await refreshAfterMutation()
      setEditingStudent(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteStudent(studentId: string, name: string) {
    const ok = await confirm({
      title: 'Remove student?',
      message: `Remove ${name} from the institution? This cannot be undone.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    })
    if (!ok) return
    await deleteStudent(studentId)
    await refreshAfterMutation()
  }

  if (loading && list.length === 0 && !fetchError) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-secondary/40 border border-border rounded-md px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or batch..."
            className="text-sm outline-none bg-transparent w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExportStudents()}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary disabled:opacity-60"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={() => setBulkUploadOpen(true)}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary"
          >
            <Upload className="w-4 h-4" />
            Bulk upload
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add student
          </button>
        </div>
      </div>

      {isAllBranches && (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCenterFilter('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium ${
            centerFilter === 'all' ? 'bg-secondary text-foreground' : 'text-muted-foreground'
          }`}
        >
          All branches
        </button>
        {centers.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCenterFilter(c.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${
              centerFilter === c.id ? 'bg-secondary text-foreground' : 'text-muted-foreground'
            }`}
          >
            {formatCenterLabel(c)}
          </button>
        ))}
      </div>
      )}

      {showForm && (
        <AppCard>
          <h3 className="font-display text-lg text-foreground mb-4">Add student</h3>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-xs text-muted-foreground">Student name *</span>
              <input name="name" required className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </label>
            <AppDropdown
              label="Board *"
              name="board"
              value={formBoard}
              onChange={setFormBoard}
              options={boards.map((b) => ({ value: b, label: b }))}
              placeholder="Select board"
            />
            <AppDropdown
              label="Grade *"
              name="grade"
              value={formGrade}
              onChange={setFormGrade}
              options={[
                { value: '8', label: 'Grade 8' },
                { value: '9', label: 'Grade 9' },
                { value: '10', label: 'Grade 10' },
              ]}
              placeholder="Select grade"
            />
            <AppDropdown
              label="Batch *"
              name="batchId"
              value={formBatch}
              onChange={setFormBatch}
              options={tutorBatches.map((b) => ({
                value: b.id,
                label: `${b.name} · ${b.board} · ${b.grade}`,
              }))}
              placeholder="Select batch"
            />
            <AppDropdown
              label="Branch / center *"
              name="centerId"
              value={formCenter}
              onChange={setFormCenter}
              options={centers.map((c) => ({
                value: c.id,
                label: formatCenterLabel(c),
              }))}
              placeholder="Select branch"
            />
            <label className="block">
              <span className="text-xs text-muted-foreground">Academic year *</span>
              <input name="academicYear" defaultValue="2025-26" className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-muted-foreground">School name</span>
              <input name="schoolName" className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </label>
            <div className="md:col-span-2">
              <PhoneCredentialFields
                phone={formPhone}
                onPhoneChange={setFormPhone}
                password={formPassword}
                onPasswordChange={setFormPassword}
                idPrefix="student-create"
              />
            </div>
            {isValidPhone(formPhone) && (
              <p className="md:col-span-2 text-xs text-muted-foreground">
                Student login: {phoneToLoginEmail(formPhone)} · Password: {resolvePassword(formPhone, formPassword)}
              </p>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={saving || !isValidPhone(formPhone)}
                className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save student'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground px-4 py-2">
                Cancel
              </button>
            </div>
          </form>
        </AppCard>
      )}

      <AppCard>
        {fetchError ? (
          <p className="text-sm text-rose py-4">{fetchError}</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No students found.</p>
        ) : (
          <div className={loading ? 'opacity-60 pointer-events-none' : undefined}>
            <ResponsiveTable minWidth={520}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Board · Grade</th>
                    <th className="pb-3 font-medium">Batch</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/30">
                      <td className="py-3">
                        <p className="font-medium text-foreground">{s.name}</p>
                        {s.schoolName && (
                          <p className="text-xs text-muted-foreground truncate max-w-[12rem]">{s.schoolName}</p>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {s.board} · {s.grade}
                      </td>
                      <td className="py-3 text-muted-foreground max-w-[10rem] truncate">
                        {batchLabels(s, tutorBatches)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            s.status === 'active'
                              ? 'bg-leaf/15 text-leaf'
                              : 'bg-rose/15 text-rose'
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.daysUntilCscDisable != null && s.status === 'active' && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            CSC: {s.daysUntilCscDisable}d left
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        <StudentRowActions
                          studentId={s.id}
                          studentName={s.name}
                          scope={scope}
                          onView={() => setViewingStudent(s)}
                          onEdit={scope === 'admin' ? () => startEdit(s) : undefined}
                          onDelete={
                            scope === 'admin'
                              ? () => void handleDeleteStudent(s.id, s.name)
                              : undefined
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          </div>
        )}

        <Pagination
          page={page}
          pages={pages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next)
            setPage(1)
          }}
        />
      </AppCard>

      <AppModal
        open={viewingStudent != null}
        onClose={() => setViewingStudent(null)}
        title="Student profile"
        description={viewingStudent?.name}
        size="xl"
        footer={
          viewingStudent ? (
            <div className="flex flex-wrap gap-2 justify-end w-full">
              {scope === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    const student = viewingStudent
                    setViewingStudent(null)
                    startEdit(student)
                  }}
                  className="text-sm px-4 py-2 rounded-md border border-border hover:bg-secondary"
                >
                  Edit
                </button>
              )}
              <Link
                to={`/${scope}/students/${viewingStudent.id}/report`}
                className="text-sm px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90"
                onClick={() => setViewingStudent(null)}
              >
                View report
              </Link>
            </div>
          ) : undefined
        }
      >
        {viewingStudent && (
          <StudentProfileView
            student={viewingStudent}
            tracking={studentTracking}
            trackingLoading={trackingLoading}
            trackingError={trackingError}
            batchLabel={batchLabels(viewingStudent, tutorBatches)}
            centerLabel={centerName(viewingStudent.centerId, centers)}
            scope={scope}
            onReviewRequest={(req) =>
              setReviewRequest({
                id: req.id,
                assessmentId: req.assessmentId,
                assessmentTitle: req.assessmentTitle,
                studentId: req.studentId,
                studentName: viewingStudent.name,
                reason: req.reason,
                status: req.status,
                requestedAt: req.requestedAt,
                reviewedBy: req.reviewedBy,
                reviewedAt: req.reviewedAt,
                reviewNotes: req.reviewNotes,
                accessGrantedUntil: req.accessGrantedUntil,
              })
            }
          />
        )}
      </AppModal>

      <ReassignmentReviewModal
        open={reviewRequest != null}
        request={reviewRequest}
        scope={scope}
        onClose={() => setReviewRequest(null)}
        onReviewed={() => {
          setReviewRequest(null)
          void refreshProfileAfterReview()
        }}
      />

      <AppModal
        open={editingStudent != null}
        onClose={() => setEditingStudent(null)}
        title="Edit student"
        description={editingStudent?.name}
        size="md"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="text-sm px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveEdit()}
              className="text-sm px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        {editingStudent && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-muted-foreground">Student name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <AppSelectMulti
              label="Batches"
              values={editBatchIds}
              onChange={setEditBatchIds}
              options={tutorBatches.map((b) => ({
                value: b.id,
                label: b.name,
                description: `${b.board} · ${b.grade}`,
              }))}
              placeholder="Assign batches"
            />
            <AppDropdown
              label="Branch / center"
              value={editCenter}
              onChange={setEditCenter}
              options={centers.map((c) => ({
                value: c.id,
                label: formatCenterLabel(c),
              }))}
              placeholder="Select branch"
            />
            <AppDropdown
              label="Account status"
              value={editStatus}
              onChange={(v) => setEditStatus(v as 'active' | 'inactive')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <dl className="rounded-md bg-secondary/30 px-3 py-2 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between gap-4">
                <span>Board</span>
                <span className="text-foreground">{editingStudent.board}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Grade</span>
                <span className="text-foreground">{editingStudent.grade}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Academic year</span>
                <span className="text-foreground">{editingStudent.academicYear}</span>
              </div>
            </dl>
          </div>
        )}
      </AppModal>

      <BulkCsvUploadModal<StudentBulkRowPayload>
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        title="Bulk upload students"
        description="Import many students from a CSV file. Login email will be phone@gmail.com and default password is the phone number."
        columnsHelp={[
          'name — full name (required)',
          'phone — 10-digit mobile (required)',
          'board — e.g. CBSE (required)',
          'grade — e.g. Grade 8 (required)',
          'batch — batch name (optional)',
          'center — branch name (optional)',
          'academic_year — default 2025-26',
          'password — optional custom password',
          'school_name — optional',
        ]}
        mapRows={(rows) =>
          studentRowsFromCsv(rows).map((row) => ({
            name: row.name,
            phone: row.phone,
            board: row.board,
            grade: row.grade,
            batch: row.batch,
            centerName: row.centerName,
            centerId: row.centerId,
            academicYear: row.academicYear,
            password: row.password,
            schoolName: row.schoolName,
          }))
        }
        validateRow={(row) => {
          if (!row.name.trim()) return 'Name is required'
          if (!isValidPhone(row.phone)) return 'Phone must be 10–15 digits'
          if (!row.board.trim()) return 'Board is required'
          if (!row.grade.trim()) return 'Grade is required'
          return null
        }}
        previewRow={(row) =>
          `${row.name} · ${row.phone} · ${row.board} · ${row.grade}${row.batch ? ` · ${row.batch}` : ''}${row.centerName ? ` · ${row.centerName}` : ''}`
        }
        onDownloadTemplate={downloadStudentsImportTemplate}
        onImport={bulkImportStudents}
        onComplete={() => void loadStudents()}
      />
    </div>
  )
}
