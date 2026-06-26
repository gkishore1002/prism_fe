import { useState, type FormEvent } from 'react'
import {
  Plus,
  Network,
  BookOpen,
  FileText,
  Check,
  Upload,
  ChevronRight,
  Users,
  Layers,
} from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { AppSelect } from '@/components/ui/AppSelect'
import { BatchStudentSearchList } from '@/components/academic/BatchStudentSearchList'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { boardsMatch, gradesMatch } from '@/lib/academicScope'
import { cn } from '@/lib/cn'

interface CurriculumSetupPanelProps {
  role: 'admin' | 'tutor'
}

type AddTarget = 'board' | 'grade' | 'subject' | 'topic' | 'batch' | null

function topicMatches(questionTopic: string, selectedTopic: string): boolean {
  const q = questionTopic.toLowerCase()
  const t = selectedTopic.toLowerCase()
  return q === t || q.includes(t) || t.includes(q)
}

function InlineAddForm({
  label,
  placeholder,
  onSubmit,
  onCancel,
}: {
  label: string
  placeholder: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState('')
  return (
    <form
      className="mt-2 p-2 rounded-md border border-accent/30 bg-accent/5 space-y-2"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSubmit(value)
        setValue('')
      }}
    >
      <label className="block text-[10px] text-muted-foreground">{label}</label>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-xs btn btn-primary px-2 py-1"
        >
          Save
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground px-2 py-1">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function CurriculumSetupPanel({ role }: CurriculumSetupPanelProps) {
  const {
    curriculum,
    batches,
    addBoard,
    addGrade,
    addSubject,
    addTopic,
    addBatch,
    addStudentToBatch,
    assignStudentToBatch,
    removeStudentFromBatch,
    getBatchesForScope,
    getStudentsForBatch,
    getUnassignedStudents,
  } = useCurriculum()
  const { questions } = useQuestionPapers()

  const [board, setBoard] = useState(curriculum[0]?.board ?? 'CBSE')
  const [grade, setGrade] = useState(curriculum[0]?.grades[0]?.grade ?? 'Grade 8')
  const [subject, setSubject] = useState(
    curriculum[0]?.grades[0]?.subjects[0]?.name ?? 'Mathematics',
  )
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [addTarget, setAddTarget] = useState<AddTarget>(null)
  const [batchName, setBatchName] = useState('')
  const [batchSubject, setBatchSubject] = useState('')
  const [createSelectedIds, setCreateSelectedIds] = useState<string[]>([])
  const [createPendingNames, setCreatePendingNames] = useState<string[]>([])
  const [createNewStudentName, setCreateNewStudentName] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [newStudentName, setNewStudentName] = useState('')

  const boardData = curriculum.find((b) => b.board === board) ?? curriculum[0]
  const gradeData = boardData?.grades.find((g) => g.grade === grade) ?? boardData?.grades[0]
  const subjectData =
    gradeData?.subjects.find((s) => s.name === subject) ?? gradeData?.subjects[0]

  const scopedBatches = boardData && gradeData ? getBatchesForScope(board, grade) : []

  const topicQuestions = selectedTopic
    ? questions.filter(
        (q) =>
          boardsMatch(q.board, board) &&
          gradesMatch(q.grade, grade) &&
          q.subject === subject &&
          topicMatches(q.topic, selectedTopic),
      )
    : []

  const totalSubjects = curriculum.reduce(
    (a, b) => a + b.grades.reduce((x, g) => x + g.subjects.length, 0),
    0,
  )
  const totalTopics = curriculum.reduce(
    (a, b) =>
      a + b.grades.reduce((x, g) => x + g.subjects.reduce((y, s) => y + s.topics.length, 0), 0),
    0,
  )

  const canManage = role === 'admin' || role === 'tutor'

  function selectBoard(next: string) {
    const data = curriculum.find((b) => b.board === next)!
    setBoard(next)
    setGrade(data.grades[0].grade)
    setSubject(data.grades[0].subjects[0].name)
    setBatchSubject('')
    setSelectedBatchId(null)
    setSelectedTopic(null)
    setAddTarget(null)
  }

  function selectGrade(next: string) {
    const data = boardData!.grades.find((g) => g.grade === next)!
    setGrade(next)
    setSubject(data.subjects[0].name)
    setBatchSubject('')
    setSelectedBatchId(null)
    setSelectedTopic(null)
    setAddTarget(null)
  }

  function selectSubject(next: string) {
    setSubject(next)
    setSelectedTopic(null)
    setAddTarget(null)
  }

  function resetBatchForm() {
    setBatchName('')
    setBatchSubject('')
    setCreateSelectedIds([])
    setCreatePendingNames([])
    setCreateNewStudentName('')
    setAddTarget(null)
  }

  function toggleCreateStudent(studentId: string) {
    setCreateSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  function addPendingStudentName() {
    const trimmed = createNewStudentName.trim()
    if (!trimmed || createPendingNames.includes(trimmed)) return
    setCreatePendingNames((prev) => [...prev, trimmed])
    setCreateNewStudentName('')
  }

  function handleAddBatch(e: FormEvent) {
    e.preventDefault()
    if (!batchName.trim()) return
    const batchId = addBatch({
      name: batchName.trim(),
      board,
      grade,
      subject: batchSubject.trim() || undefined,
      avgScore: 0,
      studentIds: createSelectedIds,
    })
    createPendingNames.forEach((name) => addStudentToBatch(batchId, name))
    resetBatchForm()
  }

  function handleAddStudentToBatch(e: FormEvent, batchId: string) {
    e.preventDefault()
    if (!newStudentName.trim()) return
    addStudentToBatch(batchId, newStudentName.trim())
    setNewStudentName('')
  }

  const selectedBatch = selectedBatchId
    ? scopedBatches.find((b) => b.id === selectedBatchId)
    : undefined
  const batchStudents = selectedBatchId ? getStudentsForBatch(selectedBatchId) : []
  const unassignedStudents = getUnassignedStudents(board, grade)
  const createSelectedStudents = unassignedStudents.filter((s) =>
    createSelectedIds.includes(s.id),
  )
  const createStudentCount = createSelectedIds.length + createPendingNames.length

  if (!boardData || !gradeData || !subjectData) {
    return (
      <AppCard className="text-center py-12">
        <p className="text-muted-foreground">Add a board to start building your curriculum.</p>
      </AppCard>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={role === 'admin' ? 'Curriculum · Institute setup' : 'Curriculum · Setup & batches'}
        title="Board → Grade → Subject → Topic"
        sub={
          role === 'admin'
            ? 'Define and maintain the academic hierarchy and batches. Reports, question banks, and assessments derive from this structure.'
            : 'Create batches for a board and grade, then add students to each batch. Subject is optional.'
        }
        actions={
          <>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Import Excel
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'board' ? null : 'board')}
                className="text-xs px-3 py-1.5 rounded-md bg-ink text-paper flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New board
              </button>
            )}
          </>
        }
      />

      {addTarget === 'board' && canManage && (
        <AppCard className="mb-4">
          <InlineAddForm
            label="Board name"
            placeholder="e.g. ICSE"
            onSubmit={(v) => {
              addBoard(v)
              setAddTarget(null)
            }}
            onCancel={() => setAddTarget(null)}
          />
        </AppCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Network className="w-3 h-3" /> Boards
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'board' ? null : 'board')}
                className="text-[10px] text-accent"
              >
                + Add
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
            {curriculum.map((b) => (
              <button
                key={b.board}
                type="button"
                onClick={() => selectBoard(b.board)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm',
                  board === b.board ? 'bg-ink text-paper' : 'hover:bg-secondary',
                )}
              >
                <div className="font-medium">{b.board}</div>
                <div
                  className={cn(
                    'text-[10px]',
                    board === b.board ? 'text-paper/60' : 'text-muted-foreground',
                  )}
                >
                  {b.grades.length} grades ·{' '}
                  {b.grades.reduce((a, g) => a + g.subjects.length, 0)} subjects
                </div>
              </button>
            ))}
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Grades · {board}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'grade' ? null : 'grade')}
                className="text-[10px] text-accent"
              >
                + Add
              </button>
            )}
          </div>
          {addTarget === 'grade' && (
            <InlineAddForm
              label="Grade name"
              placeholder="e.g. Grade 10"
              onSubmit={(v) => {
                addGrade(board, v)
                setAddTarget(null)
              }}
              onCancel={() => setAddTarget(null)}
            />
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin mt-2">
            {boardData.grades.map((g) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => selectGrade(g.grade)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm',
                  grade === g.grade ? 'bg-ink text-paper' : 'hover:bg-secondary',
                )}
              >
                <div className="font-medium">{g.grade}</div>
                <div
                  className={cn(
                    'text-[10px]',
                    grade === g.grade ? 'text-paper/60' : 'text-muted-foreground',
                  )}
                >
                  {g.subjects.length} subjects ·{' '}
                  {g.subjects.reduce((a, s) => a + s.topics.length, 0)} topics
                </div>
              </button>
            ))}
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Subjects · {grade}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'subject' ? null : 'subject')}
                className="text-[10px] text-accent"
              >
                + Add
              </button>
            )}
          </div>
          {addTarget === 'subject' && (
            <InlineAddForm
              label="Subject name"
              placeholder="e.g. Science"
              onSubmit={(v) => {
                addSubject(board, grade, v)
                setAddTarget(null)
              }}
              onCancel={() => setAddTarget(null)}
            />
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin mt-2">
            {gradeData.subjects.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => selectSubject(s.name)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm',
                  subject === s.name ? 'bg-ink text-paper' : 'hover:bg-secondary',
                )}
              >
                <div className="font-medium">{s.name}</div>
                <div
                  className={cn(
                    'text-[10px]',
                    subject === s.name ? 'text-paper/60' : 'text-muted-foreground',
                  )}
                >
                  {s.topics.length} topics · {s.topics.reduce((a, t) => a + t.questions, 0)} qs
                </div>
              </button>
            ))}
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Topics · {subject}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'topic' ? null : 'topic')}
                className="text-[10px] text-accent"
              >
                + Add
              </button>
            )}
          </div>
          {addTarget === 'topic' && (
            <InlineAddForm
              label="Topic name"
              placeholder="e.g. Linear Equations"
              onSubmit={(v) => {
                addTopic(board, grade, subject, v)
                setAddTarget(null)
              }}
              onCancel={() => setAddTarget(null)}
            />
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin mt-2">
            {subjectData.topics.map((t) => {
              const active = selectedTopic === t.name
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTopic(active ? null : t.name)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    active ? 'bg-accent/15 border border-accent/40' : 'hover:bg-secondary',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-leaf shrink-0" />
                    <span className="flex-1 font-medium truncate">{t.name}</span>
                    <ChevronRight
                      className={cn(
                        'w-3 h-3 text-muted-foreground transition-transform',
                        active && 'rotate-90 text-accent',
                      )}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 pl-5 flex items-center gap-3">
                    <span className="font-mono-data">{t.questions} in bank</span>
                    <span className="font-mono-data">{t.mastery}% mastery</span>
                  </div>
                </button>
              )
            })}
            {subjectData.topics.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No topics yet — add one above.</p>
            )}
          </div>
        </AppCard>
      </div>

      {/* Batches — scoped to board + grade */}
      <div id="batches">
      <AppCard className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-display text-lg">Batches</h3>
              <p className="text-xs text-muted-foreground">
                {board} · {grade} — {scopedBatches.length} batch
                {scopedBatches.length !== 1 ? 'es' : ''} · {batches.length} total
              </p>
            </div>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                if (addTarget === 'batch') {
                  resetBatchForm()
                } else {
                  setAddTarget('batch')
                }
              }}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary inline-flex items-center gap-1.5 self-start"
            >
              <Plus className="w-3.5 h-3.5" /> Add batch
            </button>
          )}
        </div>

        {addTarget === 'batch' && (
          <form
            onSubmit={handleAddBatch}
            className="mb-4 p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-4"
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="block sm:col-span-2 lg:col-span-1">
                <span className="text-xs text-muted-foreground">Batch name *</span>
                <input
                  required
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Batch A"
                  className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                />
              </label>
              <AppSelect
                label="Subject (optional)"
                value={batchSubject}
                onChange={setBatchSubject}
                options={[
                  { value: '', label: 'No subject' },
                  ...gradeData.subjects.map((s) => ({ value: s.name, label: s.name })),
                ]}
                placeholder="No subject"
              />
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                <button type="submit" className="btn btn-primary px-4 py-2 text-sm">
                  Save batch
                  {createStudentCount > 0 ? ` (${createStudentCount} students)` : ''}
                </button>
                <button
                  type="button"
                  onClick={resetBatchForm}
                  className="text-sm text-muted-foreground px-2"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 pt-2 border-t border-border/60">
              <div>
                <p className="text-xs font-medium text-foreground mb-2">
                  Add existing students ({board} · {grade})
                </p>
                <BatchStudentSearchList
                  students={unassignedStudents}
                  mode="pick"
                  selectedIds={createSelectedIds}
                  onToggle={toggleCreateStudent}
                  emptyMessage="No unassigned students for this board and grade."
                  searchPlaceholder="Search students to add…"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Add new student</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <label className="flex-1 block">
                      <input
                        value={createNewStudentName}
                        onChange={(e) => setCreateNewStudentName(e.target.value)}
                        placeholder="Student name"
                        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={addPendingStudentName}
                      disabled={!createNewStudentName.trim()}
                      className="border border-border px-4 py-2 rounded-md text-sm hover:bg-card disabled:opacity-40 shrink-0"
                    >
                      Add to list
                    </button>
                  </div>
                </div>

                {(createSelectedStudents.length > 0 || createPendingNames.length > 0) && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">
                      Selected for this batch ({createStudentCount})
                    </p>
                    <ul className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                      {createSelectedStudents.map((student) => (
                        <li
                          key={student.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-md bg-card border border-border text-sm"
                        >
                          <span className="truncate">{student.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleCreateStudent(student.id)}
                            className="text-xs text-muted-foreground hover:text-rose shrink-0"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                      {createPendingNames.map((name) => (
                        <li
                          key={name}
                          className="flex items-center justify-between gap-2 p-2 rounded-md bg-card border border-border text-sm"
                        >
                          <span className="truncate">
                            {name}
                            <span className="text-xs text-muted-foreground ml-1">(new)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCreatePendingNames((prev) => prev.filter((n) => n !== name))
                            }
                            className="text-xs text-muted-foreground hover:text-rose shrink-0"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {scopedBatches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No batches for {board} · {grade} yet. Add a batch to assign students and schedule assessments.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-3 font-medium">Batch</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Students</th>
                    <th className="pb-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scopedBatches.map((b) => {
                    const active = selectedBatchId === b.id
                    const count = b.studentIds.length
                    return (
                      <tr
                        key={b.id}
                        className={cn('hover:bg-secondary/30', active && 'bg-accent/5')}
                      >
                        <td className="py-3 font-medium">{b.name}</td>
                        <td className="py-3 text-muted-foreground">{b.subject ?? '—'}</td>
                        <td className="py-3 font-mono-data">{count}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedBatchId(active ? null : b.id)}
                            className="text-xs text-accent hover:underline"
                          >
                            {active ? 'Close' : 'Manage students'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {selectedBatch && (
              <div className="rounded-lg border border-border bg-secondary/20 p-4 sm:p-5 space-y-5">
                <div>
                  <h4 className="font-medium text-foreground">
                    Students in {selectedBatch.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {board} · {grade}
                    {selectedBatch.subject ? ` · ${selectedBatch.subject}` : ''} ·{' '}
                    {batchStudents.length} enrolled
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Enrolled students</p>
                  {batchStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students in this batch yet.</p>
                  ) : (
                    <BatchStudentSearchList
                      students={batchStudents}
                      mode="enrolled"
                      onRemove={(studentId) =>
                        removeStudentFromBatch(studentId, selectedBatch.id)
                      }
                      emptyMessage="No students match your search."
                      searchPlaceholder="Search enrolled students…"
                    />
                  )}
                </div>

                <div className="grid lg:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">
                      Add existing students ({board} · {grade})
                    </p>
                    {unassignedStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        All students for this board and grade are already in a batch.
                      </p>
                    ) : (
                      <BatchStudentSearchList
                        students={unassignedStudents}
                        mode="pick"
                        selectedIds={[]}
                        onToggle={(studentId) =>
                          assignStudentToBatch(studentId, selectedBatch.id)
                        }
                        emptyMessage="No unassigned students match your search."
                        searchPlaceholder="Search students to add…"
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Add new student</p>
                    <form
                      onSubmit={(e) => handleAddStudentToBatch(e, selectedBatch.id)}
                      className="flex flex-col sm:flex-row gap-2 sm:items-end"
                    >
                      <label className="flex-1 block">
                        <input
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          placeholder="Student name"
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={!newStudentName.trim()}
                        className="btn btn-primary px-4 py-2 text-sm disabled:opacity-40 shrink-0"
                      >
                        Add to batch
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </AppCard>
      </div>

      {selectedTopic && (
        <AppCard className="mt-6">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-accent">Topic questions</div>
              <div className="font-display text-xl mt-1">{selectedTopic}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {board} · {grade} · {subject} · {topicQuestions.length} question
                {topicQuestions.length !== 1 ? 's' : ''} tagged
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close ×
            </button>
          </div>

          {topicQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No questions in the bank for this topic yet. Upload via Question Bank.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">ID</th>
                    <th className="text-left px-4 py-3">Chapter</th>
                    <th className="text-left px-4 py-3">Question</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Difficulty</th>
                    <th className="text-right px-4 py-3">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {topicQuestions.map((q) => (
                    <tr key={q.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono-data text-xs text-muted-foreground">{q.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{q.chapter}</td>
                      <td className="px-4 py-3 max-w-md">{q.text}</td>
                      <td className="px-4 py-3 uppercase text-xs">{q.questionType}</td>
                      <td className="px-4 py-3 capitalize">{q.difficulty}</td>
                      <td className="px-4 py-3 text-right font-mono-data">{q.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>
      )}

      <AppCard className="mt-6">
        <div className="font-display text-xl mb-2">Why this matters</div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Maintain boards, grades, subjects, topics, and batches in one place. Every assessment,
          report, and batch view derives from this structure. Click a topic to inspect its questions.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
          <div className="border border-border rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-accent">Boards</div>
            <div className="font-mono-data text-2xl mt-1">{curriculum.length}</div>
          </div>
          <div className="border border-border rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-accent">Subjects</div>
            <div className="font-mono-data text-2xl mt-1">{totalSubjects}</div>
          </div>
          <div className="border border-border rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-accent">Topics</div>
            <div className="font-mono-data text-2xl mt-1">{totalTopics}</div>
          </div>
          <div className="border border-border rounded-md p-3">
            <div className="text-[10px] uppercase tracking-widest text-accent flex items-center gap-1">
              <Users className="w-3 h-3" /> Batches
            </div>
            <div className="font-mono-data text-2xl mt-1">{batches.length}</div>
          </div>
        </div>
      </AppCard>
    </>
  )
}
