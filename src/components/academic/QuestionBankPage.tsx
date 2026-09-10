import { Fragment, useMemo, useState, useEffect } from 'react'
import {
  FileText,
  Eye,
  FilePlus2,
  CheckSquare,
  Square,
  PenLine,
  Library,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { ActionMenu, ActionMenuItem, ActionMenuLink } from '@/components/ui/ActionMenu'
import { QuestionUploadWorkflow } from '@/components/academic/QuestionUploadWorkflow'
import { SyllabusBooksPanel } from '@/components/academic/SyllabusBooksPanel'
import { ManualQuestionEntry } from '@/components/academic/ManualQuestionEntry'
import { EmptyState } from '@/components/design/InsightCard'
import { Pagination } from '@/components/ui/Pagination'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useAuth } from '@/hooks/useAuth'
import { DEFAULT_PAGE_LIMIT } from '@/lib/pagination'
import { topicCounts, totalMarksForQuestions } from '@/lib/questionPaperUtils'
import { cn } from '@/lib/cn'
import { useConfirmModal } from '@/components/ui/AppModal'
import { formatSubjects } from '@/lib/formatSubjects'

interface QuestionBankPageProps {
  role?: 'tutor' | 'admin'
  readOnly?: boolean
}

type WorkspaceTab = 'library' | 'create' | 'import' | 'books'

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
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT)

  const paperPreviewBase =
    role === 'tutor' ? '/tutor/question-bank/papers' : '/admin/question-bank/papers'

  const libraryPages = Math.max(1, Math.ceil(questionPapers.length / limit))
  const pagedPapers = useMemo(() => {
    const start = (page - 1) * limit
    return questionPapers.slice(start, start + limit)
  }, [questionPapers, page, limit])

  useEffect(() => {
    if (page > libraryPages) setPage(libraryPages)
  }, [page, libraryPages])

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
    { id: 'books', label: 'Books', hide: readOnly },
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
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      className="btn btn-secondary shrink-0"
                      onClick={() => setTab('create')}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary shrink-0"
                      onClick={() => setTab('import')}
                    >
                      Import
                    </button>
                  </div>
                ) : undefined
              }
            />
          ) : (
            <AppCard className="p-0 sm:p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="px-4 sm:px-5 py-3 font-medium">Paper</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Curriculum</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Source</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Questions</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Marks</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Topics</th>
                      <th className="px-4 sm:px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagedPapers.map((paper) => {
                      const counts = topicCounts(paper, questions)
                      const showCustom = customPaperId === paper.id
                      return (
                        <Fragment key={paper.id}>
                          <tr className="hover:bg-secondary/30 align-top">
                            <td className="px-4 sm:px-5 py-3">
                              <div className="flex items-start gap-2.5 min-w-[180px]">
                                <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                <p className="font-medium text-foreground">{paper.name}</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3 text-muted-foreground whitespace-nowrap">
                              {paper.board} · {paper.grade} ·{' '}
                              {formatSubjects(paper.subjects, paper.subject)}
                            </td>
                            <td className="px-4 sm:px-5 py-3">
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-muted-foreground">
                                {SOURCE_LABEL[paper.source] ?? paper.source}
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3 font-mono-data">
                              {paper.questionIds.length}
                            </td>
                            <td className="px-4 sm:px-5 py-3 font-mono-data">{paper.totalMarks}</td>
                            <td className="px-4 sm:px-5 py-3">
                              <p className="font-mono-data">{counts.length}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px] truncate">
                                {counts
                                  .slice(0, 3)
                                  .map(({ topic, count }) => `${topic} (${count})`)
                                  .join(', ')}
                                {counts.length > 3 ? ` +${counts.length - 3}` : ''}
                              </p>
                            </td>
                            <td className="px-4 sm:px-5 py-3">
                              <ActionMenu label={`Actions for ${paper.name}`}>
                                <ActionMenuLink to={`${paperPreviewBase}/${paper.id}`}>
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                  Open
                                </ActionMenuLink>
                                {!readOnly && (
                                  <ActionMenuItem
                                    onSelect={() =>
                                      showCustom ? setCustomPaperId(null) : openCustomForm(paper.id)
                                    }
                                  >
                                    <FilePlus2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    {showCustom ? 'Close custom' : 'Custom'}
                                  </ActionMenuItem>
                                )}
                                {!readOnly && (
                                  <ActionMenuItem
                                    className="text-rose"
                                    onSelect={() => {
                                      void confirm({
                                        title: 'Delete question paper?',
                                        message: `Delete "${paper.name}"?`,
                                        confirmLabel: 'Delete',
                                        variant: 'danger',
                                      }).then((ok) => {
                                        if (ok) void removePaper(paper.id)
                                      })
                                    }}
                                  >
                                    Delete
                                  </ActionMenuItem>
                                )}
                              </ActionMenu>
                            </td>
                          </tr>
                          {showCustom && !readOnly && (
                            <tr>
                              <td colSpan={7} className="px-4 sm:px-5 py-4 bg-secondary/20">
                                <form
                                  onSubmit={(e) => handleCreateCustom(e, paper.id)}
                                  className="space-y-4"
                                >
                                  <label className="block">
                                    <span className="text-xs text-muted-foreground">
                                      Custom paper name *
                                    </span>
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
                                    className="btn btn-primary disabled:opacity-40"
                                  >
                                    Publish custom paper
                                  </button>
                                </form>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 sm:px-5 pb-4">
                <Pagination
                  page={page}
                  pages={libraryPages}
                  total={questionPapers.length}
                  limit={limit}
                  itemLabel="papers"
                  onPageChange={setPage}
                  onLimitChange={(next) => {
                    setLimit(next)
                    setPage(1)
                  }}
                />
              </div>
            </AppCard>
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

      {tab === 'books' && !readOnly && (
        <section>
          <SyllabusBooksPanel />
        </section>
      )}
    </>
  )
}
