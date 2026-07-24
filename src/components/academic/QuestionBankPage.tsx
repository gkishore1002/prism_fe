import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Eye, FilePlus2, ChevronDown, ChevronUp, Upload, CheckSquare, Square, PenLine } from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { QuestionUploadWorkflow } from '@/components/academic/QuestionUploadWorkflow'
import { ManualQuestionEntry } from '@/components/academic/ManualQuestionEntry'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { useAuth } from '@/hooks/useAuth'
import { topicCounts, totalMarksForQuestions } from '@/lib/questionPaperUtils'
import { cn } from '@/lib/cn'
import { useConfirmModal } from '@/components/ui/AppModal'

interface QuestionBankPageProps {
  role?: 'tutor' | 'admin'
  readOnly?: boolean
}

function SectionHeading({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof FileText
  title: string
  sub?: string
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-accent shrink-0" />
        <h2 className="font-display text-xl text-foreground">{title}</h2>
      </div>
      {sub && <p className="text-sm text-muted-foreground mt-1 ml-7">{sub}</p>}
    </div>
  )
}

function CollapsibleSection({
  icon: Icon,
  title,
  sub,
  open,
  onToggle,
  children,
}: {
  icon: typeof FileText
  title: string
  sub?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="mb-4">
      <AppCard className="p-0 overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-start gap-2 min-w-0">
            <Icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg text-foreground">{title}</h2>
              {sub && <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>}
            </div>
          </div>
          {open ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
        </button>
        {open && <div className="border-t border-border p-4">{children}</div>}
      </AppCard>
    </section>
  )
}

export function QuestionBankPage({ role = 'tutor', readOnly = false }: QuestionBankPageProps) {
  const { user } = useAuth()
  const { questionPapers, questions, createCustomPaper, removePaper, ensureLoaded } = useQuestionPapers()
  const { confirm } = useConfirmModal()

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])
  const [customPaperId, setCustomPaperId] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [customSelectedTopics, setCustomSelectedTopics] = useState<string[]>([])
  const [customQuestionIds, setCustomQuestionIds] = useState<string[]>([])
  const [manualOpen, setManualOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

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
    await createCustomPaper(
      customName.trim(),
      parentId,
      customQuestionIds,
      user.id,
    )
    setCustomPaperId(null)
    setCustomName('')
    setCustomSelectedTopics([])
    setCustomQuestionIds([])
  }

  const customSelectedQuestions = questions.filter((q) => customQuestionIds.includes(q.id))

  return (
    <>
      <PageHeader
        eyebrow="Board → Grade → Subject → Chapter → Topic → Question"
        title="Question Bank"
        sub={
          readOnly
            ? 'Browse tutor-uploaded question papers organized by topic. Creation and uploads are tutor-only.'
            : 'Browse saved papers first. Expand add or upload below when you need to build a new question paper.'
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AppStat label="Question papers" value={questionPapers.length} />
        <AppStat
          label="Total questions"
          value={questionPapers.reduce((n, p) => n + p.questionIds.length, 0)}
          hint="Across all papers"
        />
        <AppStat
          label="Topics covered"
          value={[...new Set(questionPapers.flatMap((p) => p.topics))].length}
          tone="leaf"
        />
      </div>

      <section className="mb-8">
        <SectionHeading
          icon={FileText}
          title={`Question papers (${questionPapers.length})`}
          sub="View saved papers or create a custom paper from selected topics and questions."
        />

        <div className="space-y-3">
          {questionPapers.length === 0 ? (
            <AppCard className="text-center py-10">
              <p className="text-muted-foreground">No question papers yet.</p>
              {!readOnly && (
                <p className="text-sm text-muted-foreground mt-2">
                  Expand <strong className="font-medium text-foreground">Add manually</strong> or{' '}
                  <strong className="font-medium text-foreground">Upload Excel</strong> below to create your first paper.
                </p>
              )}
            </AppCard>
          ) : (
            questionPapers.map((paper) => {
              const counts = topicCounts(paper, questions)
              const showCustom = customPaperId === paper.id
              return (
                <AppCard key={paper.id} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-accent shrink-0" />
                        <p className="font-display text-lg">{paper.name}</p>
                        {paper.source === 'custom' && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            Custom paper
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {paper.board} · {paper.grade} · {paper.subject} · Created {paper.createdAt}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {counts.map(({ topic, count }) => (
                          <span
                            key={topic}
                            className="text-[10px] px-2 py-1 rounded-full bg-accent/10 text-accent"
                          >
                            {topic} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm shrink-0">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Questions
                        </div>
                        <div className="font-mono-data text-lg">{paper.questionIds.length}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Marks
                        </div>
                        <div className="font-mono-data text-lg">{paper.totalMarks}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        to={`${paperPreviewBase}/${paper.id}`}
                        className="btn btn-primary gap-1.5 text-sm px-4 py-2"
                      >
                        <Eye className="w-4 h-4" /> View paper
                      </Link>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            void confirm({
                              title: 'Delete question paper?',
                              message: `Delete paper "${paper.name}"? All linked custom papers may be affected.`,
                              confirmLabel: 'Delete',
                              variant: 'danger',
                            }).then((ok) => {
                              if (ok) void removePaper(paper.id)
                            })
                          }}
                          className="text-xs text-rose hover:underline"
                        >
                          Delete paper
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            showCustom ? setCustomPaperId(null) : openCustomForm(paper.id)
                          }
                          className="inline-flex items-center justify-center gap-1.5 text-sm border border-border px-4 py-2 rounded-md hover:bg-secondary/60"
                        >
                          <FilePlus2 className="w-4 h-4" />
                          {showCustom ? (
                            <>
                              Cancel <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Create custom paper <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {showCustom && !readOnly && (
                    <form
                      onSubmit={(e) => handleCreateCustom(e, paper.id)}
                      className="border-t border-border pt-4 space-y-4"
                    >
                      <p className="text-sm text-muted-foreground">
                        Build a new question paper from &ldquo;{paper.name}&rdquo; — choose topics
                        (questions are selected automatically) or fine-tune individual questions below.
                      </p>
                      <label className="block">
                        <span className="text-xs text-muted-foreground">Custom paper name *</span>
                        <input
                          required
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Algebra — selected questions"
                          className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                        />
                      </label>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Select topics</span>
                          <button
                            type="button"
                            onClick={() => toggleAllCustomTopics(paper)}
                            className="text-xs text-accent hover:underline"
                          >
                            {customSelectedTopics.length === paper.topics.length
                              ? 'Clear all topics'
                              : 'Select all topics'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {counts.map(({ topic, count }) => {
                            const active = customSelectedTopics.includes(topic)
                            return (
                              <button
                                key={topic}
                                type="button"
                                onClick={() => toggleCustomTopic(topic, paper.id)}
                                className={cn(
                                  'text-xs px-3 py-1.5 rounded-md border transition-colors',
                                  active
                                    ? 'border-accent bg-accent/10 text-foreground'
                                    : 'border-border text-muted-foreground hover:bg-secondary/50',
                                )}
                              >
                                {topic} ({count})
                              </button>
                            )
                          })}
                        </div>
                        {customSelectedTopics.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {customSelectedTopics.length} topic{customSelectedTopics.length !== 1 ? 's' : ''}{' '}
                            selected — matching questions are checked automatically.
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Select questions *</span>
                          <button
                            type="button"
                            onClick={selectAllVisibleQuestions}
                            className="text-xs text-accent hover:underline"
                          >
                            {customVisibleQuestions.every((q) => customQuestionIds.includes(q.id))
                              ? 'Deselect visible'
                              : 'Select all visible'}
                          </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-md p-2">
                          {customVisibleQuestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Select a topic above to see and include its questions.
                            </p>
                          ) : (
                            customVisibleQuestions.map((q) => {
                              const selected = customQuestionIds.includes(q.id)
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => toggleCustomQuestion(q.id)}
                                  className={cn(
                                    'w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors',
                                    selected
                                      ? 'bg-accent/10 border border-accent/30'
                                      : 'hover:bg-secondary/50 border border-transparent',
                                  )}
                                >
                                  {selected ? (
                                    <CheckSquare className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground line-clamp-2">{q.text}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {q.topic} · {q.difficulty} · {q.marks} marks
                                    </p>
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {customQuestionIds.length} question{customQuestionIds.length !== 1 ? 's' : ''}{' '}
                          selected · {totalMarksForQuestions(customSelectedQuestions)} marks
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={customQuestionIds.length === 0}
                        className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40"
                      >
                        Save custom paper
                      </button>
                    </form>
                  )}
                </AppCard>
              )
            })
          )}
        </div>
      </section>

      {!readOnly && (
        <>
          <CollapsibleSection
            icon={PenLine}
            title="Add manually"
            sub="Add multiple questions on one screen, save a local draft, then publish as a question paper."
            open={manualOpen}
            onToggle={() => setManualOpen((v) => !v)}
          >
            <ManualQuestionEntry />
          </CollapsibleSection>

          <CollapsibleSection
            icon={Upload}
            title="Upload Excel"
            sub="Download the template, upload your file, and save valid rows as a question paper."
            open={uploadOpen}
            onToggle={() => setUploadOpen((v) => !v)}
          >
            <QuestionUploadWorkflow variant="minimal" />
          </CollapsibleSection>
        </>
      )}
    </>
  )
}