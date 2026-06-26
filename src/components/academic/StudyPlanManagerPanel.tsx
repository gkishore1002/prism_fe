import { useState, type FormEvent } from 'react'
import { Plus, Calendar, Target, Users, CheckCircle2, Circle } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { AppSelect } from '@/components/ui/AppSelect'
import { useStudyPlans } from '@/hooks/useStudyPlans'
import { useCurriculum } from '@/hooks/useCurriculum'
import { cn } from '@/lib/cn'
import type { StudyPlan } from '@/types'

const taskTypeStyles: Record<string, string> = {
  Revise: 'bg-blue-100 text-blue-800 border-blue-200',
  Practice: 'bg-accent/20 text-ink border-accent/40',
  Assessment: 'bg-ink/10 text-ink border-ink/20',
  Review: 'bg-leaf/15 text-leaf border-leaf/30',
}

function planProgress(plan: StudyPlan) {
  const done = plan.days.filter((d) => d.done).length
  return { done, total: plan.days.length, pct: plan.days.length ? Math.round((done / plan.days.length) * 100) : 0 }
}

export function StudyPlanManagerPanel() {
  const { studyPlans, addStudyPlan, updateStudyPlan } = useStudyPlans()
  const { curriculum, students, getBatchesForScope } = useCurriculum()
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(studyPlans[0]?.id ?? null)

  const [title, setTitle] = useState('')
  const [board, setBoard] = useState(curriculum[0]?.board ?? 'CBSE')
  const [grade, setGrade] = useState(curriculum[0]?.grades[0]?.grade ?? 'Grade 8')
  const [subject, setSubject] = useState('Mathematics')
  const [batchName, setBatchName] = useState('')
  const [durationDays, setDurationDays] = useState(14)
  const [baselineScore, setBaselineScore] = useState(60)
  const [targetScore, setTargetScore] = useState(80)

  const boardData = curriculum.find((b) => b.board === board) ?? curriculum[0]
  const gradeData = boardData?.grades.find((g) => g.grade === grade) ?? boardData?.grades[0]
  const scopedBatches = getBatchesForScope(board, grade)
  const batchStudents = students.filter((s) => s.batch === batchName)

  const selected = studyPlans.find((p) => p.id === selectedId)

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !batchName) return
    const id = addStudyPlan({
      title: title.trim(),
      board,
      grade,
      subject,
      batchName,
      studentIds: batchStudents.map((s) => s.id),
      baselineScore,
      targetScore,
      durationDays,
      status: 'active',
      createdByTutorId: 'tut-1',
    })
    setSelectedId(id)
    setShowForm(false)
    setTitle('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Personalised learning"
        title="Study plans"
        sub="Create and assign structured day-by-day study plans for batches and students."
        actions={
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Create study plan
          </button>
        }
      />

      {showForm && (
        <AppCard className="mb-6">
          <h3 className="font-display text-lg mb-4">New study plan</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-xs text-muted-foreground">Plan title *</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 14-day Algebra booster"
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
            </label>
            <AppSelect
              label="Board"
              value={board}
              onChange={(v) => {
                setBoard(v)
                const data = curriculum.find((b) => b.board === v)
                if (data) {
                  setGrade(data.grades[0].grade)
                  setSubject(data.grades[0].subjects[0].name)
                }
              }}
              options={curriculum.map((b) => ({ value: b.board, label: b.board }))}
            />
            <AppSelect
              label="Grade"
              value={grade}
              onChange={setGrade}
              options={boardData?.grades.map((g) => ({ value: g.grade, label: g.grade })) ?? []}
            />
            <AppSelect
              label="Subject"
              value={subject}
              onChange={setSubject}
              options={gradeData?.subjects.map((s) => ({ value: s.name, label: s.name })) ?? []}
            />
            <AppSelect
              label="Batch *"
              value={batchName}
              onChange={setBatchName}
              options={scopedBatches.map((b) => ({ value: b.name, label: b.name }))}
              placeholder="Select batch"
            />
            <label className="block">
              <span className="text-xs text-muted-foreground">Duration (days)</span>
              <input
                type="number"
                min={3}
                max={30}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background font-mono-data"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Baseline score %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={baselineScore}
                onChange={(e) => setBaselineScore(Number(e.target.value))}
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background font-mono-data"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Target score %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background font-mono-data"
              />
            </label>
            {batchName && (
              <p className="md:col-span-2 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                {batchStudents.length} student{batchStudents.length !== 1 ? 's' : ''} in {batchName} will
                receive this plan
              </p>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-ink text-paper px-4 py-2 rounded-md text-sm">
                Create & assign
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-muted-foreground px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </AppCard>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Your plans</h3>
          {studyPlans.length === 0 ? (
            <AppCard className="text-center py-8 text-sm text-muted-foreground">
              No study plans yet. Create one for a batch.
            </AppCard>
          ) : (
            studyPlans.map((plan) => {
              const { done, total, pct } = planProgress(plan)
              const active = selectedId === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedId(plan.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-colors',
                    active ? 'border-accent bg-accent/10' : 'border-border hover:bg-secondary/40',
                  )}
                >
                  <p className="font-medium text-foreground">{plan.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.batchName} · {plan.subject} · {plan.durationDays} days
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono-data">
                    {done}/{total} days · {pct}%
                  </p>
                </button>
              )
            })
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <AppCard>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full',
                      selected.status === 'active'
                        ? 'bg-leaf/15 text-leaf'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {selected.status}
                  </span>
                  <h3 className="font-display text-xl mt-2">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selected.board} · {selected.grade} · {selected.batchName} ·{' '}
                    {selected.studentIds.length} students
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <div className="text-center px-4 py-2 rounded-lg bg-secondary/50">
                    <Target className="w-4 h-4 text-accent mx-auto mb-1" />
                    <p className="font-mono-data text-lg font-bold">
                      {selected.baselineScore}% → {selected.targetScore}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Target</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-[28rem] overflow-y-auto scrollbar-thin">
                {selected.days.map((d) => (
                  <div
                    key={d.id}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 rounded-lg border',
                      d.done ? 'border-leaf/30 bg-leaf/5' : 'border-border',
                    )}
                  >
                    <span className="font-mono-data text-xs text-muted-foreground w-12 shrink-0">
                      Day {d.day}
                    </span>
                    {d.done ? (
                      <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{d.focus}</p>
                      {d.topic && <p className="text-xs text-muted-foreground">{d.topic}</p>}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded border font-medium shrink-0',
                        taskTypeStyles[d.type] ?? 'bg-secondary',
                      )}
                    >
                      {d.type}
                    </span>
                    <span className="font-mono-data text-xs text-muted-foreground w-12 text-right shrink-0">
                      {d.mins}m
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                {selected.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => updateStudyPlan(selected.id, { status: 'active' })}
                    className="text-sm bg-ink text-paper px-4 py-2 rounded-md"
                  >
                    Publish plan
                  </button>
                )}
                {selected.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => updateStudyPlan(selected.id, { status: 'completed' })}
                    className="text-sm border border-border px-4 py-2 rounded-md hover:bg-secondary"
                  >
                    Mark completed
                  </button>
                )}
              </div>
            </AppCard>
          ) : (
            <AppCard className="text-center py-12 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
              Select a study plan to view and manage
            </AppCard>
          )}
        </div>
      </div>
    </>
  )
}
