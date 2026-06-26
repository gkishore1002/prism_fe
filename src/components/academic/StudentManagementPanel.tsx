import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload, Search, FileText } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { AppSelect } from '@/components/ui/AppSelect'
import {
  studentMasterProfiles,
  institutionCenters,
  boards,
} from '@/data/mock'
import { useCurriculum } from '@/hooks/useCurriculum'
import type { StudentMasterProfile } from '@/types'

interface StudentManagementPanelProps {
  scope: 'tutor' | 'admin'
  students?: StudentMasterProfile[]
}

function centerName(id: string) {
  return institutionCenters.find((c) => c.id === id)?.name ?? id
}

export function StudentManagementPanel({
  scope,
  students = studentMasterProfiles,
}: StudentManagementPanelProps) {
  const { batches: tutorBatches } = useCurriculum()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [centerFilter, setCenterFilter] = useState('all')
  const [list, setList] = useState(students)
  const [formBoard, setFormBoard] = useState(boards[0]?.name ?? 'CBSE')
  const [formGrade, setFormGrade] = useState('8')
  const [formBatch, setFormBatch] = useState(tutorBatches[0]?.name ?? 'Batch A')
  const [formCenter, setFormCenter] = useState(institutionCenters[0]?.id ?? 'ctr-andheri')

  const filtered = list.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.batch.toLowerCase().includes(search.toLowerCase())
    const matchesCenter = centerFilter === 'all' || s.centerId === centerFilter
    const matchesScope =
      scope === 'admin' || ['ctr-andheri', 'ctr-borivali'].includes(s.centerId)
    return matchesSearch && matchesCenter && matchesScope
  })

  function handleAddStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const newStudent: StudentMasterProfile = {
      id: `stu-${Date.now()}`,
      name: String(form.get('name') || ''),
      board: String(form.get('board') || 'CBSE'),
      grade: String(form.get('grade') || '8'),
      batch: String(form.get('batch') || 'Batch A'),
      centerId: String(form.get('centerId') || 'ctr-andheri'),
      academicYear: String(form.get('academicYear') || '2025-26'),
      schoolName: String(form.get('schoolName') || '') || undefined,
      email: String(form.get('email') || '') || undefined,
      status: 'active',
    }
    setList((prev) => [...prev, newStudent])
    setShowForm(false)
    e.currentTarget.reset()
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
            className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-md text-sm hover:bg-secondary/60"
          >
            <Upload className="w-4 h-4" />
            Bulk import
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
        {institutionCenters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCenterFilter(c.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${
              centerFilter === c.id ? 'bg-secondary text-foreground' : 'text-muted-foreground'
            }`}
          >
            {c.name}
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
              options={boards.map((b) => ({ value: b.name, label: b.name }))}
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
              name="batch"
              value={formBatch}
              onChange={setFormBatch}
              options={tutorBatches.map((b) => ({ value: b.name, label: b.name }))}
              placeholder="Select batch"
            />
            <AppSelect
              label="Branch / center *"
              name="centerId"
              value={formCenter}
              onChange={setFormCenter}
              options={institutionCenters.map((c) => ({
                value: c.id,
                label: c.name,
                description: c.city,
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
              <button type="submit" className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium">
                Save student
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground px-4 py-2">
                Cancel
              </button>
            </div>
          </form>
        </AppCard>
      )}

      <AppCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Board</th>
                <th className="pb-3 font-medium">Grade</th>
                <th className="pb-3 font-medium">Batch</th>
                <th className="pb-3 font-medium">Branch</th>
                <th className="pb-3 font-medium">Academic year</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30">
                  <td className="py-3">
                    <p className="font-medium text-foreground">{s.name}</p>
                    {s.schoolName && (
                      <p className="text-xs text-muted-foreground">{s.schoolName}</p>
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">{s.board}</td>
                  <td className="py-3 font-mono-data">{s.grade}</td>
                  <td className="py-3 text-muted-foreground">{s.batch}</td>
                  <td className="py-3 text-muted-foreground">{centerName(s.centerId)}</td>
                  <td className="py-3 text-muted-foreground">{s.academicYear}</td>
                  <td className="py-3">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/15 text-leaf">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {scope === 'admin' && (
                        <Link
                          to={`/admin/students/${s.id}/report`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <FileText className="w-3 h-3" />
                          Report
                        </Link>
                      )}
                      <button type="button" className="text-xs text-muted-foreground hover:underline">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  )
}
