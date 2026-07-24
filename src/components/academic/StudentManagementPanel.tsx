import { useState, useEffect, useRef, type ReactNode } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { Link } from 'react-router-dom'
import { Plus, Search, FileText, MoreVertical, Eye, Pencil } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppSelectMulti } from '@/components/ui/AppSelectMulti'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { useCenters } from '@/hooks/useCenters'
import { createStudent, deleteStudent, updateStudentApi } from '@/lib/api/curriculumApi'
import { AppModal, useConfirmModal } from '@/components/ui/AppModal'
import { formatCenterLabel, centerLabelById } from '@/lib/centerLabel'
import type { StudentMasterProfile } from '@/types'

import type { InstitutionCenter } from '@/types'

interface StudentManagementPanelProps {
  scope: 'tutor' | 'admin'
  students?: StudentMasterProfile[]
}

function centerName(id: string, centers: InstitutionCenter[]) {
  return centerLabelById(id, centers)
}

function batchLabels(student: StudentMasterProfile, batches: { id: string; name: string }[]) {
  if (student.batchIds?.length) {
    return student.batchIds
      .map((id) => batches.find((b) => b.id === id)?.name ?? id)
      .join(', ')
  }
  return student.batch || '—'
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1 py-2 border-b border-border last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || '—'}</dd>
    </div>
  )
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
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative flex justify-end" ref={menuRef}>
      <button
        type="button"
        aria-label={`Actions for ${studentName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-50 min-w-[10rem] rounded-md border border-border bg-card shadow-lg py-1 text-sm"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onView()
              setOpen(false)
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary text-left"
          >
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            View
          </button>
          {scope === 'admin' && onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onEdit()
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary text-left"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              Edit
            </button>
          )}
          {scope === 'admin' && (
            <Link
              to={`/admin/students/${studentId}/report`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary text-foreground"
            >
              <FileText className="w-3.5 h-3.5 text-accent" />
              View report
            </Link>
          )}
          {scope === 'admin' && onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="w-full text-left px-3 py-2 hover:bg-secondary text-rose"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function StudentManagementPanel({
  scope,
  students: studentsProp,
}: StudentManagementPanelProps) {
  useAnalyticsPage('adminStudents')
  const { batches: tutorBatches, curriculum, refresh: refreshCurriculum, ensureLoaded: ensureCurriculumLoaded } =
    useCurriculum()
  const { confirm } = useConfirmModal()
  const { studentMaster, loading: analyticsLoading, refresh: refreshAnalytics } = useAnalytics()
  const { centers } = useCenters()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewingStudent, setViewingStudent] = useState<StudentMasterProfile | null>(null)
  const [editingStudent, setEditingStudent] = useState<StudentMasterProfile | null>(null)
  const [editName, setEditName] = useState('')
  const [editCenter, setEditCenter] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [list, setList] = useState<StudentMasterProfile[]>([])
  const boards = curriculum.map((b) => b.board)
  const [formBoard, setFormBoard] = useState(boards[0] ?? 'CBSE')
  const [formGrade, setFormGrade] = useState('8')
  const [formBatch, setFormBatch] = useState(tutorBatches[0]?.id ?? '')
  const [formCenter, setFormCenter] = useState('')
  const [editBatchIds, setEditBatchIds] = useState<string[]>([])

  useEffect(() => {
    void ensureCurriculumLoaded()
  }, [ensureCurriculumLoaded])

  useEffect(() => {
    const source = studentsProp ?? studentMaster
    setList(source as StudentMasterProfile[])
  }, [studentsProp, studentMaster])

  useEffect(() => {
    if (centers[0] && !formCenter) setFormCenter(centers[0].id)
  }, [centers, formCenter])

  const loading = analyticsLoading

  const filtered = list.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.batch.toLowerCase().includes(search.toLowerCase())
    const matchesCenter = centerFilter === 'all' || s.centerId === centerFilter
    return matchesSearch && matchesCenter
  })

  const [saving, setSaving] = useState(false)

  async function refreshAfterMutation() {
    await refreshCurriculum()
    await refreshAnalytics('adminStudents')
  }

  async function handleAddStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
      })
      await refreshAfterMutation()
      const source = studentsProp ?? studentMaster
      setList(source as StudentMasterProfile[])
      setShowForm(false)
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
    setEditCenter(student.centerId)
  }

  async function handleSaveEdit() {
    if (!editingStudent) return
    setSaving(true)
    try {
      await updateStudentApi(editingStudent.id, {
        name: editName.trim(),
        batchIds: editBatchIds,
        centerId: editCenter,
      })
      await refreshAfterMutation()
      const batchLabel = tutorBatches
        .filter((b) => editBatchIds.includes(b.id))
        .map((b) => b.name)
        .join(', ')
      setList((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                name: editName.trim(),
                batch: batchLabel,
                batchIds: editBatchIds,
                centerId: editCenter,
              }
            : s,
        ),
      )
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
    setList((prev) => prev.filter((s) => s.id !== studentId))
    await refreshAfterMutation()
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-secondary/40 border border-border rounded-md px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or batch..."
            className="text-sm outline-none bg-transparent w-full"
          />
        </div>
        <div className="flex gap-2">
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

      {showForm && (
        <AppCard>
          <h3 className="font-display text-lg text-foreground mb-4">Add student</h3>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-xs text-muted-foreground">Student name *</span>
              <input name="name" required className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </label>
            <AppSelect
              label="Board *"
              name="board"
              value={formBoard}
              onChange={setFormBoard}
              options={boards.map((b) => ({ value: b, label: b }))}
              placeholder="Select board"
            />
            <AppSelect
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
            <AppSelect
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
            <AppSelect
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
            <label className="block">
              <span className="text-xs text-muted-foreground">School name</span>
              <input name="schoolName" className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Email</span>
              <input name="email" type="email" className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background" />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60">
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
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No students found.</p>
        ) : (
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
                {filtered.map((s) => (
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
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/15 text-leaf">
                        {s.status}
                      </span>
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
        )}
      </AppCard>

      <AppModal
        open={viewingStudent != null}
        onClose={() => setViewingStudent(null)}
        title={viewingStudent?.name}
        description="Student profile details"
        size="md"
        footer={
          scope === 'admin' && viewingStudent ? (
            <div className="flex flex-wrap gap-2 justify-end w-full">
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
              <Link
                to={`/admin/students/${viewingStudent.id}/report`}
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
          <dl>
            <DetailRow label="Board" value={viewingStudent.board} />
            <DetailRow label="Grade" value={viewingStudent.grade} />
            <DetailRow label="Batch" value={batchLabels(viewingStudent, tutorBatches)} />
            <DetailRow label="Branch" value={centerName(viewingStudent.centerId, centers)} />
            <DetailRow label="Academic year" value={viewingStudent.academicYear} />
            <DetailRow label="School" value={viewingStudent.schoolName} />
            <DetailRow label="Email" value={viewingStudent.email} />
            <DetailRow
              label="Status"
              value={
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/15 text-leaf">
                  {viewingStudent.status}
                </span>
              }
            />
            <DetailRow label="Student ID" value={<span className="font-mono-data text-xs">{viewingStudent.id}</span>} />
          </dl>
        )}
      </AppModal>

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
            <AppSelect
              label="Branch / center"
              value={editCenter}
              onChange={setEditCenter}
              options={centers.map((c) => ({
                value: c.id,
                label: formatCenterLabel(c),
              }))}
              placeholder="Select branch"
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
    </div>
  )
}