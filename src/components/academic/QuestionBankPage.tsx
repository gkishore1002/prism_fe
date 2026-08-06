import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Eye,
  FilePlus2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  PenLine,
  Library,
  Sparkles,
  CheckCircle2,
  Copy,
  BarChart3,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { QuestionUploadWorkflow } from '@/components/academic/QuestionUploadWorkflow'
import { ManualQuestionEntry } from '@/components/academic/ManualQuestionEntry'
import { EmptyState, SectionLabel } from '@/components/design/InsightCard'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useAuth } from '@/hooks/useAuth'
import { topicCounts, totalMarksForQuestions } from '@/lib/questionPaperUtils'
import { cn } from '@/lib/cn'
import { useConfirmModal } from '@/components/ui/AppModal'

interface QuestionBankPageProps {
  role?: 'tutor' | 'admin'
  readOnly?: boolean
}

type WorkspaceTab = 'library' | 'create' | 'import'

const SOURCE_LABEL: Record<string, string> = {
  upload: 'Imported',
  manual: 'Manual',
  custom: 'Custom',
}

export function QuestionBankPage({ role = 'tutor', readOnly = false }: QuestionBankPageProps) {
  const { user } = useAuth()
  const { questionPapers, questions, createCustomPaper, removePaper, ensureLoaded } =
    useQuestionPapers()
  const { confirm } = useConfirmModal()

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const [tab, setTab] = useState<WorkspaceTab>('library')
  const [flash, setFlash] = useState<string | null>(null)
  const [customPaperId, setCustomPaperId] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [customSelectedTopics, setCustomSelectedTopics] = useState<string[]>([])
  const [customQuestionIds, setCustomQuestionIds] = useState<string[]>([])

  const paperPreviewBase =
    role === 'tutor' ? '/tutor/question-bank/papers' : '/admin/question-bank/papers'

  const customParent = customPaperId ? questionPapers.find((p) => p.id === customPaperId) : undefined

  const customVisibleQuestions = useMemo(() => {
    if (!customParent) return []
    return questions.filter((q) => {
      if (!customParent.questionIds.includes(q.id)) return false
      if (customSelectedTopics.length === 0) return true
      return customSelectedTopics.includes(q.topic)
    })
  }, [customParent, questions, customSelectedTopics])

  function showFlash(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 3500)
  }

  function questionIdsForTopic(paperId: string, topic: string) {
    const paper = questionPapers.find((p) => p.id === paperId)
    if (!paper) return []
    return questions
      .filter((q) => paper.questionIds.includes(q.id) && q.topic === topic)
      .map((q) => q.id)
  }

  function openCustomForm(paperId: string) {
    setCustomPaperId(paperId)
    setCustomName('')
    setCustomSelectedTopics([])
    setCustomQuestionIds([])
    setTab('library')
  }

  function toggleCustomTopic(topic: string, paperId: string) {
    const adding = !customSelectedTopics.includes(topic)
    const topicQuestionIds = questionIdsForTopic(paperId, topic)
    setCustomSelectedTopics((prev) =>
      adding ? [...prev, topic] : prev.filter((t) => t !== topic),
    )
    setCustomQuestionIds((prev) =>
      adding
        ? [...new Set([...prev, ...topicQuestionIds])]
        : prev.filter((id) => !topicQuestionIds.includes(id)),
    )
  }

  function toggleAllCustomTopics(paper: { id: string; topics: string[]; questionIds: string[] }) {
    const allSelected = customSelectedTopics.length === paper.topics.length
    if (allSelected) {
      setCustomSelectedTopics([])
      setCustomQuestionIds([])
    } else {
      setCustomSelectedTopics([...paper.topics])
      setCustomQuestionIds([...paper.questionIds])
    }
  }

  function toggleCustomQuestion(id: string) {
    setCustomQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id],
    )
  }

  function selectAllVisibleQuestions() {
    const visibleIds = customVisibleQuestions.map((q) => q.id)
    const allSelected = visibleIds.every((id) => customQuestionIds.includes(id))
    if (allSelected) {
      setCustomQuestionIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setCustomQuestionIds((prev) => [...new Set([...prev, ...visibleIds])])
    }
  }

  async function handleCreateCustom(e: React.FormEvent, parentId: string) {
    e.preventDefault()
    if (!customName.trim() || customQuestionIds.length === 0) return
    await createCustomPaper(customName.trim(), parentId, customQuestionIds, user.id)
    setCustomPaperId(null)
    setCustomName('')
    setCustomSelectedTopics([])
    setCustomQuestionIds([])
    showFlash('Custom paper published to the library.')
  }

  const selectedForCustom = questions.filter((q) => customQuestionIds.includes(q.id))
  const totalQuestions = questionPapers.reduce((n, p) => n + p.questionIds.length, 0)
  const topicCount = [...new Set(questionPapers.flatMap((p) => p.topics))].length

  const tabs: { id: WorkspaceTab; label: string; hide?: boolean }[] = [
    { id: 'library', label: 'Library' },
    { id: 'create', label: 'Create', hide: readOnly },
    { id: 'import', label: 'Import', hide: readOnly },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Content intelligence"
        title="Question Bank"
        sub={
          readOnly
            ? 'Browse published papers. Creation and import are tutor-only.'
            : 'Modern content library — author, import, and reuse assessment-ready papers.'
        }
      />

      {flash && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-leaf">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {flash}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <AppStat label="Papers" value={questionPapers.length} />
        <AppStat label="Questions" value={totalQuestions} hint="Inventory" />
        <AppStat label="Topics" value={topicCount} tone="leaf" />
      </div>

      <div
        className="ln-tabs-bar inline-flex flex-wrap gap-1 mb-6"
        role="tablist"
        aria-label="Question bank"
      >
        {tabs
          .filter((t) => !t.hide)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2 rounded-[10px] text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'library' && (
        <section>
          {questionPapers.length === 0 ? (
            <EmptyState
              icon={Library}
              title="No papers yet"
              description="Create manually or import Excel / JSON to publish your first assessment-ready paper."
              action={
                !readOnly ? (
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-secondary text-sm" onClick={() => setTab('create')}>
                      Create
                    </button>
                    <button type="button" className="btn btn-primary text-sm" onClick={() => setTab('import')}>
                      Import
                    </button>
                  </div>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {questionPapers.map((paper, idx) => {
                const counts = topicCounts(paper, questions)
                const showCustom = customPaperId === paper.id
                const paperQuestions = questions.filter((q) => paper.questionIds.includes(q.id))
                return (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <AppCard className="h-full flex flex-col gap-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent shrink-0">
                          <FileText className="w-5 h-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-lg text-foreground truncate">
                              {paper.name}
                            </h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-muted-foreground">
                              {SOURCE_LABEL[paper.source] ?? paper.source}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {paper.board} · {paper.grade} · {paper.subject}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-secondary px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Qs</p>
                          <p className="font-display text-lg font-semibold">{paper.questionIds.length}</p>
                        </div>
                        <div className="rounded-xl bg-secondary px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Marks</p>
                          <p className="font-display text-lg font-semibold">{paper.totalMarks}</p>
                        </div>
                        <div className="rounded-xl bg-secondary px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Topics</p>
                          <p className="font-display text-lg font-semibold">{counts.length}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {counts.slice(0, 5).map(({ topic, count }) => (
                          <span
                            key={topic}
                            className="text-[10px] px-2 py-1 rounded-md bg-slate-100 text-muted-foreground"
                          >
                            {topic} · {count}
                          </span>
                        ))}
                      </div>

                      {/* Sample question content cards */}
                      <div className="space-y-2">
                        <SectionLabel>Preview</SectionLabel>
                        {paperQuestions.slice(0, 2).map((q) => (
                          <div
                            key={q.id}
                            className="rounded-2xl border border-border bg-secondary/80 p-3"
                          >
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/15 text-accent capitalize">
                                {q.difficulty}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-muted-foreground">
                                {q.topic}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-muted-foreground">
                                {q.marks}m · {q.questionType}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">{q.text}</p>
                            <div className="mt-2 flex gap-2 text-[10px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI explain
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" /> Analytics
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Copy className="w-3 h-3" /> Duplicate
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2 pt-1">
                        <Link
                          to={`${paperPreviewBase}/${paper.id}`}
                          className="btn btn-primary text-xs px-3 py-2 gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Open
                        </Link>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              showCustom ? setCustomPaperId(null) : openCustomForm(paper.id)
                            }
                            className="btn btn-secondary text-xs px-3 py-2 gap-1.5"
                          >
                            <FilePlus2 className="w-3.5 h-3.5" />
                            Custom
                            {showCustom ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              void confirm({
                                title: 'Delete question paper?',
                                message: `Delete "${paper.name}"?`,
                                confirmLabel: 'Delete',
                                variant: 'danger',
                              }).then((ok) => {
                                if (ok) void removePaper(paper.id)
                              })
                            }}
                            className="btn btn-ghost text-xs px-3 py-2 text-rose"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {showCustom && !readOnly && (
                        <form
                          onSubmit={(e) => handleCreateCustom(e, paper.id)}
                          className="border-t border-border pt-4 space-y-4"
                        >
                          <label className="block">
                            <span className="text-xs text-muted-foreground">Custom paper name *</span>
                            <input
                              required
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="ios-input mt-1"
                              placeholder="e.g. Algebra focus set"
                            />
                          </label>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-xs text-muted-foreground">Topics</span>
                              <button
                                type="button"
                                onClick={() => toggleAllCustomTopics(paper)}
                                className="text-xs text-accent"
                              >
                                Toggle all
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {counts.map(({ topic, count }) => (
                                <button
                                  key={topic}
                                  type="button"
                                  onClick={() => toggleCustomTopic(topic, paper.id)}
                                  className={cn(
                                    'text-xs px-3 py-1.5 rounded-lg border',
                                    customSelectedTopics.includes(topic)
                                      ? 'border-accent bg-accent/15 text-foreground'
                                      : 'border-border text-muted-foreground',
                                  )}
                                >
                                  {topic} ({count})
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Questions</span>
                              <button
                                type="button"
                                onClick={selectAllVisibleQuestions}
                                className="text-xs text-accent"
                              >
                                Select visible
                              </button>
                            </div>
                            {customVisibleQuestions.map((q) => {
                              const selected = customQuestionIds.includes(q.id)
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => toggleCustomQuestion(q.id)}
                                  className={cn(
                                    'w-full flex items-start gap-3 p-3 rounded-xl text-left border',
                                    selected
                                      ? 'border-accent/40 bg-accent/10'
                                      : 'border-transparent hover:bg-slate-50',
                                  )}
                                >
                                  {selected ? (
                                    <CheckSquare className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                  )}
                                  <span className="text-sm line-clamp-2">{q.text}</span>
                                </button>
                              )
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {customQuestionIds.length} selected ·{' '}
                            {totalMarksForQuestions(selectedForCustom)} marks
                          </p>
                          <button
                            type="submit"
                            disabled={customQuestionIds.length === 0}
                            className="btn btn-primary text-sm disabled:opacity-40"
                          >
                            Publish custom paper
                          </button>
                        </form>
                      )}
                    </AppCard>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'create' && !readOnly && (
        <section>
          <AppCard>
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-4 h-4 text-accent" />
              <h2 className="font-display text-lg">Author paper</h2>
            </div>
            <ManualQuestionEntry />
          </AppCard>
        </section>
      )}

      {tab === 'import' && !readOnly && (
        <section>
          <QuestionUploadWorkflow
            variant="full"
            onPaperCreated={() => {
              showFlash('Paper imported into the library.')
              setTab('library')
            }}
          />
        </section>
      )}
    </>
  )
}
