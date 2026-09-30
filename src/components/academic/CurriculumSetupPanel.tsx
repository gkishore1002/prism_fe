import { useState, useEffect, useMemo, Fragment, type FormEvent } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import {
  Plus,
  Network,
  BookOpen,
  FileText,
  Check,
  ChevronRight,
  Trash2,
  Pencil,
  Layers,
  Clock,
} from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { AppDropdown, AppSelectMulti } from '@/components/ui/AppDropdown'
import { Pagination } from '@/components/ui/Pagination'
import { FormErrorBanner } from '@/components/ui/FormErrorBanner'
import { RequiredMark } from '@/components/ui/RequiredMark'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useConfirmModal } from '@/components/ui/AppModal'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { boardsMatch, gradesMatch } from '@/lib/academicScope'
import { formatSubjects, normalizeSubjectsList } from '@/lib/formatSubjects'
import { DEFAULT_PAGE_LIMIT, pageCount, paginateItems } from '@/lib/pagination'
import { cn } from '@/lib/cn'
import { MathContent } from '@/components/math/MathContent'

interface CurriculumSetupPanelProps {
  role: 'admin' | 'tutor'
}

type AddTarget = 'board' | 'grade' | 'subject' | 'topic' | 'batch' | null
type EditTarget =
  | { kind: 'board'; name: string }
  | { kind: 'grade'; name: string }
  | { kind: 'subject'; name: string }
  | { kind: 'topic'; name: string }
  | { kind: 'batch'; id: string; name: string; subjects: string[]; scheduleTiming: string }
  | null

function topicMatches(questionTopic: string, selectedTopic: string): boolean {
  const q = questionTopic.toLowerCase()
  const t = selectedTopic.toLowerCase()
  return q === t || q.includes(t) || t.includes(q)
}

function ExistingItemsHint({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null
  return (
    <div className="mt-2 pt-2 border-t border-border/60">
      <p className="text-[10px] text-muted-foreground mb-1.5">
        {label} ({items.length})
      </p>
      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollbar-thin">
        {items.map((name) => (
          <span
            key={name}
            className="inline-block px-1.5 py-0.5 rounded bg-secondary text-[10px] text-foreground"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

function InlineAddForm({
  label,
  placeholder,
  existingItems = [],
  existingLabel = 'Already added',
  saving = false,
  prerequisiteMessage = null,
  onSubmit,
  onCancel,
  onDuplicate,
}: {
  label: string
  placeholder: string
  existingItems?: string[]
  existingLabel?: string
  saving?: boolean
  prerequisiteMessage?: string | null
  onSubmit: (value: string) => boolean | Promise<boolean>
  onCancel: () => void
  onDuplicate?: (value: string) => void
}) {
  const [value, setValue] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  return (
    <form
      className="mt-2 p-2 rounded-md border border-accent/30 bg-accent/5 space-y-2"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        void (async () => {
          setLocalError(null)
          if (prerequisiteMessage) {
            setLocalError(prerequisiteMessage)
            return
          }
          const trimmed = value.trim()
          if (!trimmed) {
            setLocalError('Enter a name before saving.')
            return
          }
          if (existingItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
            onDuplicate?.(trimmed)
            setLocalError(`"${trimmed}" already exists — pick a different name.`)
            return
          }
          const ok = await onSubmit(trimmed)
          if (ok) {
            setValue('')
            setLocalError(null)
          }
        })()
      }}
    >
      <label className="block text-[10px] text-muted-foreground">{label}</label>
      {prerequisiteMessage ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">{prerequisiteMessage}</p>
      ) : null}
      <input
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (localError) setLocalError(null)
        }}
        placeholder={placeholder}
        disabled={saving || Boolean(prerequisiteMessage)}
        className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background disabled:opacity-60"
      />
      {localError ? <FormErrorBanner message={localError} size="sm" /> : null}
      <ExistingItemsHint items={existingItems} label={existingLabel} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || Boolean(prerequisiteMessage)}
          className="text-xs btn btn-primary px-2 py-1 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs text-muted-foreground px-2 py-1 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function DeleteButton({
  label,
  onDelete,
  className,
}: {
  label: string
  onDelete: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onDelete()
      }}
      className={cn(
        'p-1 rounded shrink-0 text-muted-foreground hover:text-rose hover:bg-rose/10 transition-colors',
        className,
      )}
      aria-label={`Delete ${label}`}
      title={`Delete ${label}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}

function EditButton({
  label,
  onEdit,
  className,
}: {
  label: string
  onEdit: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onEdit()
      }}
      className={cn(
        'p-1 rounded shrink-0 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors',
        className,
      )}
      aria-label={`Edit ${label}`}
      title={`Rename ${label}`}
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  )
}

function InlineEditForm({
  label,
  currentValue,
  existingItems = [],
  saving = false,
  onSubmit,
  onCancel,
}: {
  label: string
  currentValue: string
  existingItems?: string[]
  saving?: boolean
  onSubmit: (value: string) => boolean | Promise<boolean>
  onCancel: () => void
}) {
  const [value, setValue] = useState(currentValue)
  const [localError, setLocalError] = useState<string | null>(null)

  return (
    <form
      className="mt-1 p-2 rounded-md border border-accent/30 bg-accent/5 space-y-2"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        void (async () => {
          setLocalError(null)
          const trimmed = value.trim()
          if (!trimmed) {
            setLocalError('Enter a name before saving.')
            return
          }
          if (trimmed === currentValue) {
            onCancel()
            return
          }
          if (existingItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
            setLocalError(`"${trimmed}" already exists — pick a different name.`)
            return
          }
          const ok = await onSubmit(trimmed)
          if (!ok) setLocalError('Could not rename. Try again.')
        })()
      }}
    >
      <label className="block text-[10px] text-muted-foreground">{label}</label>
      <input
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (localError) setLocalError(null)
        }}
        disabled={saving}
        className="w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background disabled:opacity-60"
      />
      {localError ? <FormErrorBanner message={localError} size="sm" /> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="text-xs btn btn-primary px-2 py-1 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Rename'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs text-muted-foreground px-2 py-1 disabled:opacity-50"
        >
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
    loading,
    error,
    ensureLoaded: ensureCurriculumLoaded,
    addBoard,
    renameBoard,
    addGrade,
    renameGrade,
    addSubject,
    renameSubject,
    addTopic,
    renameTopic,
    addBatch,
    updateBatch,
    removeBatch,
    removeBoard,
    removeGrade,
    removeSubject,
    removeTopic,
  } = useCurriculum()
  const { confirm } = useConfirmModal()
  const { questions, ensureLoaded } = useQuestionPapers()

  useEffect(() => {
    void ensureCurriculumLoaded()
    void ensureLoaded()
  }, [ensureCurriculumLoaded, ensureLoaded])

  const [board, setBoard] = useState('')
  const [grade, setGrade] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [addTarget, setAddTarget] = useState<AddTarget>(null)
  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [saving, setSaving] = useState(false)

  // Batch form (listed separately from curriculum tree; board/grade from curriculum)
  const [batchBoard, setBatchBoard] = useState('')
  const [batchGrade, setBatchGrade] = useState('')
  const [batchName, setBatchName] = useState('')
  const [batchSubjects, setBatchSubjects] = useState<string[]>([])
  const [batchScheduleTiming, setBatchScheduleTiming] = useState('')
  const [batchFormError, setBatchFormError] = useState<string | null>(null)
  const [batchPage, setBatchPage] = useState(1)
  const [batchLimit, setBatchLimit] = useState(DEFAULT_PAGE_LIMIT)

  const curriculumBoards = useMemo(() => curriculum.map((b) => b.board), [curriculum])
  const batchFormGrades = useMemo(() => {
    const node = curriculum.find((b) => boardsMatch(b.board, batchBoard))
    return node?.grades.map((g) => g.grade) ?? []
  }, [curriculum, batchBoard])
  const batchFormSubjectOptions = useMemo(() => {
    const boardNode = curriculum.find((b) => boardsMatch(b.board, batchBoard))
    const gradeNode = boardNode?.grades.find((g) => gradesMatch(g.grade, batchGrade))
    return gradeNode?.subjects.map((s) => s.name) ?? []
  }, [curriculum, batchBoard, batchGrade])

  const batchPages = pageCount(batches.length, batchLimit)
  const pagedBatches = useMemo(
    () => paginateItems(batches, batchPage, batchLimit),
    [batches, batchPage, batchLimit],
  )

  useEffect(() => {
    if (batchPage > batchPages) setBatchPage(batchPages)
  }, [batchPage, batchPages])

  useEffect(() => {
    if (addTarget !== 'batch') return
    if (!batchBoard && (board || curriculumBoards[0])) {
      setBatchBoard(board || curriculumBoards[0])
    }
  }, [addTarget, batchBoard, board, curriculumBoards])

  useEffect(() => {
    if (addTarget !== 'batch') return
    if (batchGrade && batchFormGrades.some((g) => gradesMatch(g, batchGrade))) return
    setBatchGrade(batchFormGrades.find((g) => gradesMatch(g, grade)) ?? batchFormGrades[0] ?? '')
  }, [addTarget, batchGrade, batchFormGrades, grade])

  useEffect(() => {
    setBatchSubjects((prev) => prev.filter((s) => batchFormSubjectOptions.includes(s)))
  }, [batchFormSubjectOptions])

  async function runAction(
    action: () => Promise<void>,
    successText: string,
  ): Promise<{ success: boolean; error?: string }> {
    setSaving(true)
    setActionMessage(null)
    try {
      await action()
      setActionMessage({ type: 'success', text: successText })
      return { success: true }
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Something went wrong'
      setActionMessage({ type: 'error', text })
      return { success: false, error: text }
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete(
    message: string,
    action: () => Promise<void>,
    successText: string,
    title = 'Delete item?',
  ) {
    const ok = await confirm({
      title,
      message,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    })
    if (!ok) return
    await runAction(action, successText)
  }

  function reportDuplicate(name: string) {
    setActionMessage({ type: 'error', text: `"${name}" already exists — pick a different name or delete the existing one.` })
  }

  useEffect(() => {
    if (curriculum.length === 0) return
    const hasBoard = curriculum.some((b) => b.board === board)
    if (!hasBoard) {
      const first = curriculum[0]
      setBoard(first.board)
      setGrade(first.grades[0]?.grade ?? '')
      setSubject(first.grades[0]?.subjects[0]?.name ?? '')
      return
    }
    const data = curriculum.find((b) => b.board === board)
    if (!data) return
    const gradeOk = data.grades.some((g) => g.grade === grade)
    if (!gradeOk) {
      setGrade(data.grades[0]?.grade ?? '')
      setSubject(data.grades[0]?.subjects[0]?.name ?? '')
      return
    }
    const gData = data.grades.find((g) => g.grade === grade)
    const subjectOk = gData?.subjects.some((s) => s.name === subject)
    if (gData && !subjectOk) {
      setSubject(gData.subjects[0]?.name ?? '')
    }
  }, [curriculum, board, grade, subject])

  const boardData = curriculum.find((b) => b.board === board) ?? curriculum[0]
  const gradeData = boardData?.grades.find((g) => g.grade === grade) ?? boardData?.grades[0]
  const subjectData =
    gradeData?.subjects.find((s) => s.name === subject) ?? gradeData?.subjects[0]

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
  /** Boards and grades are institute structure — admin / org admin only. */
  const canManageBoardGrade = role === 'admin'

  function selectBoard(next: string) {
    const data = curriculum.find((b) => b.board === next)
    if (!data) return
    setBoard(next)
    const firstGrade = data.grades[0]
    if (firstGrade) {
      setGrade(firstGrade.grade)
      setSubject(firstGrade.subjects[0]?.name ?? '')
    } else {
      setGrade('')
      setSubject('')
    }
    setSelectedTopic(null)
    setAddTarget(null)
  }

  function selectGrade(next: string) {
    const data = boardData?.grades.find((g) => g.grade === next)
    if (!data) return
    setGrade(next)
    setSubject(data.subjects[0]?.name ?? '')
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
    setBatchSubjects([])
    setBatchScheduleTiming('')
    setBatchFormError(null)
    setAddTarget(null)
  }

  async function handleAddBatch(e: FormEvent) {
    e.preventDefault()
    setBatchFormError(null)
    if (!batchBoard || !batchGrade) {
      setBatchFormError('Select board and grade from Curriculum setup.')
      return
    }
    const trimmed = batchName.trim()
    if (!trimmed) {
      setBatchFormError('Enter a batch name before saving.')
      return
    }
    const duplicate = batches.some(
      (b) =>
        boardsMatch(b.board, batchBoard) &&
        gradesMatch(b.grade, batchGrade) &&
        b.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      setBatchFormError(`"${trimmed}" already exists for ${batchBoard} · ${batchGrade}.`)
      return
    }
    const result = await runAction(async () => {
      await addBatch({
        name: trimmed,
        board: batchBoard,
        grade: batchGrade,
        subjects: batchSubjects,
        subject: batchSubjects[0],
        scheduleTiming: batchScheduleTiming.trim() || undefined,
        avgScore: 0,
        studentIds: [],
      })
      resetBatchForm()
      setBatchPage(1)
    }, `Batch "${trimmed}" created`)
    if (!result.success) {
      setBatchFormError(result.error ?? 'Could not create batch.')
    }
  }

  const isEmpty = curriculum.length === 0
  const existingBoardNames = curriculum.map((b) => b.board)
  const existingGradeNames = boardData?.grades.map((g) => g.grade) ?? []
  const existingSubjectNames = gradeData?.subjects.map((s) => s.name) ?? []
  const existingTopicNames = subjectData?.topics.map((t) => t.name) ?? []

  if (loading) {
    return <PageLoader label="Loading curriculum…" />
  }

  if (error) {
    return (
      <AppCard className="text-center py-10">
        <p className="text-sm text-rose mb-2">Could not load curriculum</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </AppCard>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={role === 'admin' ? 'Curriculum · Institute setup' : 'Curriculum · Setup'}
        title="Board → Grade → Subject → Topic"
        sub={
          role === 'admin'
            ? 'Define the academic hierarchy and batches. Reports and assessments derive from this structure.'
            : 'Select an existing board and grade, then add subjects, topics, and batches. Boards and grades are managed by your admin.'
        }
      />

      {actionMessage && (
        <div
          className={cn(
            'mb-4 rounded-md px-4 py-3 text-sm',
            actionMessage.type === 'success'
              ? 'bg-leaf/10 text-leaf border border-leaf/30'
              : 'bg-rose/10 text-rose border border-rose/30',
          )}
        >
          {actionMessage.text}
        </div>
      )}

      {isEmpty && canManageBoardGrade && (
        <AppCard className="mb-6 accent-yellow">
          <h3 className="font-display text-lg text-foreground mb-1">Start your curriculum</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first board to unlock grades, subjects, topics, and batches. This is the foundation
            for question banks, assessments, and student reports.
          </p>
          <InlineAddForm
            label="First board name"
            placeholder="e.g. CBSE"
            existingItems={existingBoardNames}
            existingLabel="Existing boards"
            saving={saving}
            onDuplicate={reportDuplicate}
            onSubmit={(v) =>
              runAction(async () => {
                await addBoard(v)
                setBoard(v)
                setAddTarget(null)
              }, `Board "${v}" added`).then((r) => r.success)
            }
            onCancel={() => setAddTarget(null)}
          />
        </AppCard>
      )}

      {isEmpty && !canManageBoardGrade && (
        <AppCard className="mb-6">
          <h3 className="font-display text-lg text-foreground mb-1">Curriculum not set up yet</h3>
          <p className="text-sm text-muted-foreground">
            An admin needs to add boards and grades before you can add subjects, topics, or batches.
          </p>
        </AppCard>
      )}

      {addTarget === 'board' && canManageBoardGrade && !isEmpty && (
        <AppCard className="mb-4">
          <InlineAddForm
            label="Board name"
            placeholder="e.g. ICSE"
            existingItems={existingBoardNames}
            existingLabel="Existing boards"
            saving={saving}
            onDuplicate={reportDuplicate}
            onSubmit={(v) =>
              runAction(async () => {
                await addBoard(v)
                setBoard(v)
                setAddTarget(null)
              }, `Board "${v}" added`).then((r) => r.success)
            }
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
            {canManageBoardGrade && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'board' ? null : 'board')}
                className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                + Add
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
            {curriculum.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No boards yet</p>
            ) : (
              curriculum.map((b) => (
              <div key={b.board} className="space-y-0.5">
                <div className="flex items-stretch gap-2 group">
                  <button
                    type="button"
                    onClick={() => selectBoard(b.board)}
                    className={cn(
                      'flex-1 text-left px-3 py-2 rounded-md text-sm min-w-0',
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
                  {canManageBoardGrade && (
                    <>
                      <EditButton
                        label={b.board}
                        className="self-center opacity-60 group-hover:opacity-100"
                        onEdit={() => setEditTarget({ kind: 'board', name: b.board })}
                      />
                      <DeleteButton
                        label={b.board}
                        className="self-center opacity-60 group-hover:opacity-100"
                        onDelete={() =>
                          void confirmDelete(
                            `Delete board "${b.board}" and all its grades, subjects, and topics?`,
                            async () => {
                              await removeBoard(b.board)
                              if (board === b.board) {
                                setSelectedTopic(null)
                              }
                            },
                            `Board "${b.board}" deleted`,
                          )
                        }
                      />
                    </>
                  )}
                </div>
                {editTarget?.kind === 'board' && editTarget.name === b.board && canManageBoardGrade && (
                  <InlineEditForm
                    label="Rename board"
                    currentValue={b.board}
                    existingItems={existingBoardNames.filter((n) => n !== b.board)}
                    saving={saving}
                    onSubmit={(v) =>
                      runAction(async () => {
                        await renameBoard(b.board, v)
                        if (board === b.board) setBoard(v)
                        setEditTarget(null)
                      }, `Board renamed to "${v}"`).then((r) => r.success)
                    }
                    onCancel={() => setEditTarget(null)}
                  />
                )}
              </div>
            ))
            )}
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Grades · {board || '—'}
            </div>
            {canManageBoardGrade && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'grade' ? null : 'grade')}
                className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                + Add
              </button>
            )}
          </div>
          {addTarget === 'grade' && canManageBoardGrade && (
            <InlineAddForm
              label="Grade name"
              placeholder="e.g. Grade 10"
              existingItems={existingGradeNames}
              existingLabel="Existing grades"
              saving={saving}
              prerequisiteMessage={!board ? 'Select a board before adding a grade.' : null}
              onDuplicate={reportDuplicate}
              onSubmit={(v) =>
                runAction(async () => {
                  if (!board) throw new Error('Select a board first.')
                  await addGrade(board, v)
                  setGrade(v)
                  setSubject('')
                  setAddTarget(null)
                }, `Grade "${v}" added`).then((r) => r.success)
              }
              onCancel={() => setAddTarget(null)}
            />
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin mt-2">
            {!boardData ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {canManageBoardGrade ? 'Select or add a board' : 'Select a board'}
              </p>
            ) : boardData.grades.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {canManageBoardGrade ? 'No grades yet' : 'No grades yet — ask an admin to add grades'}
              </p>
            ) : (
              boardData.grades.map((g) => (
              <div key={g.grade} className="space-y-0.5">
                <div className="flex items-stretch gap-2 group">
                  <button
                    type="button"
                    onClick={() => selectGrade(g.grade)}
                    className={cn(
                      'flex-1 text-left px-3 py-2 rounded-md text-sm min-w-0',
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
                  {canManageBoardGrade && (
                    <>
                      <EditButton
                        label={g.grade}
                        className="self-center opacity-60 group-hover:opacity-100"
                        onEdit={() => setEditTarget({ kind: 'grade', name: g.grade })}
                      />
                      <DeleteButton
                        label={g.grade}
                        className="self-center opacity-60 group-hover:opacity-100"
                        onDelete={() =>
                          void confirmDelete(
                            `Delete grade "${g.grade}" and all its subjects and topics?`,
                            async () => {
                              await removeGrade(board, g.grade)
                              if (grade === g.grade) {
                                setSelectedTopic(null)
                              }
                            },
                            `Grade "${g.grade}" deleted`,
                          )
                        }
                      />
                    </>
                  )}
                </div>
                {editTarget?.kind === 'grade' && editTarget.name === g.grade && canManageBoardGrade && (
                  <InlineEditForm
                    label="Rename grade"
                    currentValue={g.grade}
                    existingItems={existingGradeNames.filter((n) => n !== g.grade)}
                    saving={saving}
                    onSubmit={(v) =>
                      runAction(async () => {
                        await renameGrade(board, g.grade, v)
                        if (grade === g.grade) setGrade(v)
                        setEditTarget(null)
                      }, `Grade renamed to "${v}"`).then((r) => r.success)
                    }
                    onCancel={() => setEditTarget(null)}
                  />
                )}
              </div>
            ))
            )}
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Subjects · {grade || '—'}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'subject' ? null : 'subject')}
                className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                + Add
              </button>
            )}
          </div>
          {addTarget === 'subject' && (
            <InlineAddForm
              label="Subject name"
              placeholder="e.g. Science"
              existingItems={existingSubjectNames}
              existingLabel="Existing subjects"
              saving={saving}
              prerequisiteMessage={
                !board ? 'Select a board first.' : !grade ? 'Select a grade before adding a subject.' : null
              }
              onDuplicate={reportDuplicate}
              onSubmit={(v) =>
                runAction(async () => {
                  if (!board || !grade) throw new Error('Select a board and grade first.')
                  await addSubject(board, grade, v)
                  setSubject(v)
                  setAddTarget(null)
                }, `Subject "${v}" added`).then((r) => r.success)
              }
              onCancel={() => setAddTarget(null)}
            />
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin mt-2">
            {!gradeData ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Select a grade</p>
            ) : gradeData.subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No subjects yet</p>
            ) : (
              gradeData.subjects.map((s) => (
              <div key={s.name} className="space-y-0.5">
                <div className="flex items-stretch gap-2 group">
                  <button
                    type="button"
                    onClick={() => selectSubject(s.name)}
                    className={cn(
                      'flex-1 text-left px-3 py-2 rounded-md text-sm min-w-0',
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
                  {canManage && (
                    <>
                      <EditButton
                        label={s.name}
                        className="self-center opacity-60 group-hover:opacity-100"
                        onEdit={() => setEditTarget({ kind: 'subject', name: s.name })}
                      />
                      <DeleteButton
                        label={s.name}
                        className="self-center opacity-60 group-hover:opacity-100"
                        onDelete={() =>
                          void confirmDelete(
                            `Delete subject "${s.name}" and all its topics? Linked questions in the bank will also be removed.`,
                            async () => {
                              await removeSubject(board, grade, s.name)
                              if (subject === s.name) setSelectedTopic(null)
                            },
                            `Subject "${s.name}" deleted`,
                          )
                        }
                      />
                    </>
                  )}
                </div>
                {editTarget?.kind === 'subject' && editTarget.name === s.name && (
                <InlineEditForm
                  label="Rename subject"
                  currentValue={s.name}
                  existingItems={existingSubjectNames.filter((n) => n !== s.name)}
                  saving={saving}
                  onSubmit={(v) =>
                    runAction(async () => {
                      await renameSubject(board, grade, s.name, v)
                      if (subject === s.name) setSubject(v)
                      setEditTarget(null)
                    }, `Subject renamed to "${v}"`).then((r) => r.success)
                  }
                  onCancel={() => setEditTarget(null)}
                />
              )}
              </div>
            ))
            )}
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Topics · {subject || '—'}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setAddTarget(addTarget === 'topic' ? null : 'topic')}
                className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                + Add
              </button>
            )}
          </div>
          {addTarget === 'topic' && (
            <InlineAddForm
              label="Topic name"
              placeholder="e.g. Linear Equations"
              existingItems={existingTopicNames}
              existingLabel="Existing topics"
              saving={saving}
              prerequisiteMessage={
                !board
                  ? 'Select a board first.'
                  : !grade
                    ? 'Select a grade first.'
                    : !subject
                      ? 'Select a subject before adding a topic.'
                      : null
              }
              onDuplicate={reportDuplicate}
              onSubmit={(v) =>
                runAction(async () => {
                  if (!board || !grade || !subject) {
                    throw new Error('Select board, grade, and subject first.')
                  }
                  await addTopic(board, grade, subject, v)
                  setSelectedTopic(v)
                  setAddTarget(null)
                }, `Topic "${v}" added`).then((r) => r.success)
              }
              onCancel={() => setAddTarget(null)}
            />
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin mt-2">
            {!subjectData ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Select a subject</p>
            ) : subjectData.topics.map((t) => {
              const active = selectedTopic === t.name
              return (
                <div key={t.name} className="space-y-0.5">
                  <div className="flex items-stretch gap-2 group">
                    <button
                      type="button"
                      onClick={() => setSelectedTopic(active ? null : t.name)}
                      className={cn(
                        'flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors min-w-0',
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
                    {canManage && (
                      <>
                        <EditButton
                          label={t.name}
                          className="self-center opacity-60 group-hover:opacity-100"
                          onEdit={() => setEditTarget({ kind: 'topic', name: t.name })}
                        />
                        <DeleteButton
                          label={t.name}
                          className="self-center opacity-60 group-hover:opacity-100"
                          onDelete={() =>
                            void confirmDelete(
                              `Delete topic "${t.name}"? Questions tagged to this topic will also be removed.`,
                              async () => {
                                await removeTopic(board, grade, subject, t.name)
                                if (selectedTopic === t.name) setSelectedTopic(null)
                              },
                              `Topic "${t.name}" deleted`,
                            )
                          }
                        />
                      </>
                    )}
                  </div>
                  {editTarget?.kind === 'topic' && editTarget.name === t.name && (
                    <InlineEditForm
                      label="Rename topic"
                      currentValue={t.name}
                      existingItems={existingTopicNames.filter((n) => n !== t.name)}
                      saving={saving}
                      onSubmit={(v) =>
                        runAction(async () => {
                          await renameTopic(board, grade, subject, t.name, v)
                          if (selectedTopic === t.name) setSelectedTopic(v)
                          setEditTarget(null)
                        }, `Topic renamed to "${v}"`).then((r) => r.success)
                      }
                      onCancel={() => setEditTarget(null)}
                    />
                  )}
                </div>
              )
            })}
            {subjectData && subjectData.topics.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No topics yet — add one above.</p>
            )}
          </div>
        </AppCard>
      </div>

      <div id="batches">
        <AppCard className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              <div>
                <h3 className="font-display text-lg">Batches</h3>
                <p className="text-xs text-muted-foreground">
                  {batches.length} batch{batches.length === 1 ? '' : 'es'} this academic year
                </p>
              </div>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  if (addTarget === 'batch') resetBatchForm()
                  else {
                    setBatchFormError(null)
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
              className="mb-4 p-4 rounded-lg border border-accent/30 bg-accent/5 space-y-3"
            >
              {batchFormError ? <FormErrorBanner message={batchFormError} size="sm" /> : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AppDropdown
                  label="Board *"
                  value={batchBoard}
                  onChange={(v) => {
                    setBatchBoard(v)
                    setBatchGrade('')
                    setBatchSubjects([])
                  }}
                  options={curriculumBoards.map((b) => ({ value: b, label: b }))}
                  placeholder={curriculumBoards.length ? 'Select board' : 'No boards yet'}
                  disabled={!curriculumBoards.length}
                />
                <AppDropdown
                  label="Grade *"
                  value={batchGrade}
                  onChange={(v) => {
                    setBatchGrade(v)
                    setBatchSubjects([])
                  }}
                  options={batchFormGrades.map((g) => ({ value: g, label: g }))}
                  placeholder={!batchBoard ? 'Select board first' : 'Select grade'}
                  disabled={!batchBoard || !batchFormGrades.length}
                />
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Batch name <RequiredMark />
                  </span>
                  <input
                    value={batchName}
                    onChange={(e) => {
                      setBatchName(e.target.value)
                      if (batchFormError) setBatchFormError(null)
                    }}
                    placeholder="e.g. Batch A"
                    className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </label>
                <AppSelectMulti
                  label="Subjects (optional)"
                  values={batchSubjects}
                  onChange={setBatchSubjects}
                  options={batchFormSubjectOptions.map((s) => ({ value: s, label: s }))}
                  placeholder={!batchGrade ? 'Select grade first' : 'Select subjects'}
                  searchable
                  disabled={!batchGrade}
                />
                <label className="block">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Class timing (optional)
                  </span>
                  <input
                    value={batchScheduleTiming}
                    onChange={(e) => setBatchScheduleTiming(e.target.value)}
                    placeholder="e.g. Mon/Wed 4–6 PM"
                    className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={saving || !batchBoard || !batchGrade || !batchName.trim()}
                    className="btn btn-primary px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save batch'}
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
            </form>
          )}

          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No batches yet. Add a batch using board and grade from curriculum above.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-3 font-medium">Batch</th>
                      <th className="pb-3 font-medium">Board · Grade</th>
                      <th className="pb-3 font-medium">Subject</th>
                      <th className="pb-3 font-medium">Timing</th>
                      <th className="pb-3 font-medium">Students</th>
                      {canManage ? <th className="pb-3 font-medium" /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBatches.map((b) => {
                      const isEditing = editTarget?.kind === 'batch' && editTarget.id === b.id
                      const editSubjects =
                        curriculum
                          .find((c) => boardsMatch(c.board, b.board))
                          ?.grades.find((g) => gradesMatch(g.grade, b.grade))
                          ?.subjects.map((s) => s.name) ?? []
                      return (
                        <Fragment key={b.id}>
                          <tr className="hover:bg-secondary/30 border-b border-border/60">
                            <td className="py-3 font-medium">{b.name}</td>
                            <td className="py-3 text-muted-foreground text-xs">
                              {b.board} · {b.grade}
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {formatSubjects(b.subjects, b.subject)}
                            </td>
                            <td className="py-3 text-muted-foreground text-xs">
                              {b.scheduleTiming ?? '—'}
                            </td>
                            <td className="py-3 font-mono-data">{b.studentIds.length}</td>
                            {canManage ? (
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <EditButton
                                    label={b.name}
                                    onEdit={() =>
                                      setEditTarget({
                                        kind: 'batch',
                                        id: b.id,
                                        name: b.name,
                                        subjects: normalizeSubjectsList(b.subjects, b.subject),
                                        scheduleTiming: b.scheduleTiming ?? '',
                                      })
                                    }
                                  />
                                  <DeleteButton
                                    label={b.name}
                                    onDelete={() =>
                                      void confirmDelete(
                                        `Delete batch "${b.name}"? Students will be unassigned from this batch.`,
                                        async () => {
                                          await removeBatch(b.id)
                                          if (editTarget?.kind === 'batch' && editTarget.id === b.id) {
                                            setEditTarget(null)
                                          }
                                        },
                                        `Batch "${b.name}" deleted`,
                                      )
                                    }
                                  />
                                </div>
                              </td>
                            ) : null}
                          </tr>
                          {isEditing && editTarget.kind === 'batch' ? (
                            <tr>
                              <td colSpan={canManage ? 6 : 5} className="pb-3">
                                <form
                                  className="p-3 rounded-md border border-accent/30 bg-accent/5 space-y-3"
                                  onSubmit={(e) => {
                                    e.preventDefault()
                                    void runAction(async () => {
                                      await updateBatch(b.id, {
                                        name: editTarget.name.trim() || undefined,
                                        subjects: editTarget.subjects,
                                        subject: editTarget.subjects[0],
                                        scheduleTiming: editTarget.scheduleTiming.trim() || undefined,
                                      })
                                      setEditTarget(null)
                                    }, `Batch "${editTarget.name}" updated`)
                                  }}
                                >
                                  <div className="grid sm:grid-cols-3 gap-3">
                                    <label className="block">
                                      <span className="text-xs text-muted-foreground">Batch name</span>
                                      <input
                                        autoFocus
                                        value={editTarget.name}
                                        onChange={(e) =>
                                          setEditTarget({ ...editTarget, name: e.target.value })
                                        }
                                        className="mt-1 w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background"
                                      />
                                    </label>
                                    <AppSelectMulti
                                      label="Subjects (optional)"
                                      values={editTarget.subjects}
                                      onChange={(subjects) =>
                                        setEditTarget({ ...editTarget, subjects })
                                      }
                                      options={editSubjects.map((s) => ({ value: s, label: s }))}
                                      placeholder="Select subjects"
                                      searchable
                                    />
                                    <label className="block">
                                      <span className="text-xs text-muted-foreground">
                                        Class timing (optional)
                                      </span>
                                      <input
                                        value={editTarget.scheduleTiming}
                                        onChange={(e) =>
                                          setEditTarget({
                                            ...editTarget,
                                            scheduleTiming: e.target.value,
                                          })
                                        }
                                        placeholder="e.g. Mon/Wed 4–6 PM"
                                        className="mt-1 w-full border border-border rounded-md px-2 py-1.5 text-sm bg-background"
                                      />
                                    </label>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      disabled={saving}
                                      className="text-xs btn btn-primary px-3 py-1.5 disabled:opacity-50"
                                    >
                                      {saving ? 'Saving…' : 'Save changes'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditTarget(null)}
                                      className="text-xs text-muted-foreground px-2 py-1"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={batchPage}
                pages={batchPages}
                total={batches.length}
                limit={batchLimit}
                onPageChange={setBatchPage}
                onLimitChange={(limit) => {
                  setBatchLimit(limit)
                  setBatchPage(1)
                }}
                itemLabel="batches"
                className="mt-4"
              />
            </>
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
              <p className="ln-table-scroll-hint sm:hidden">Swipe sideways to see all columns</p>
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
                      <td className="px-4 py-3 max-w-md">
                        <MathContent text={q.text} />
                      </td>
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
          Maintain boards, grades, subjects, topics, and batches in one place. Every assessment and
          report derives from this structure. Click a topic to inspect its questions.
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
            <div className="text-[10px] uppercase tracking-widest text-accent">Batches</div>
            <div className="font-mono-data text-2xl mt-1">{batches.length}</div>
          </div>
        </div>
      </AppCard>
    </>
  )
}