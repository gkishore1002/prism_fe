import { useEffect, useState } from 'react'
import { Download, Printer, Trash2 } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { useAssessments } from '@/hooks/useAssessments'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { fetchAssessment } from '@/lib/api/assessmentsApi'
import { useConfirmModal } from '@/components/ui/AppModal'
import type { QuestionBankEntry, TutorAssessmentSchedule } from '@/types'

function groupQuestionsByTopic(items: QuestionBankEntry[]) {
  const groups = new Map<string, QuestionBankEntry[]>()
  for (const q of items) {
    const list = groups.get(q.topic) ?? []
    list.push(q)
    groups.set(q.topic, list)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function renderOptions(q: QuestionBankEntry) {
  const opts = [
    q.optionA && { key: 'A', label: q.optionA },
    q.optionB && { key: 'B', label: q.optionB },
    q.optionC && { key: 'C', label: q.optionC },
    q.optionD && { key: 'D', label: q.optionD },
  ].filter(Boolean) as { key: string; label: string }[]

  if (opts.length === 0) {
    return (
      <div className="mt-3 h-16 border border-dashed border-border rounded-md bg-secondary/30" />
    )
  }

  return (
    <div className="mt-3 grid sm:grid-cols-2 gap-2">
      {opts.map((opt) => (
        <div key={opt.key} className="text-sm px-3 py-2 rounded-md border border-border">
          <span className="font-mono-data text-xs text-muted-foreground mr-2">{opt.key}.</span>
          {opt.label}
        </div>
      ))}
    </div>
  )
}

type QuestionPaperViewProps =
  | { assessmentId: string; paperId?: never; showHeader?: boolean; editable?: boolean }
  | { paperId: string; assessmentId?: never; showHeader?: boolean; editable?: boolean }

export function QuestionPaperView(props: QuestionPaperViewProps) {
  const { showHeader = true, editable = false } = props
  const { assessments, ensureLoaded: ensureAssessmentsLoaded } = useAssessments()
  const { getPaper, getQuestionsByIds, removeQuestion, ensureLoaded: ensurePapersLoaded } =
    useQuestionPapers()
  const { confirm } = useConfirmModal()
  const [fetchedAssessment, setFetchedAssessment] = useState<TutorAssessmentSchedule | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setPageLoading(true)
      setNotFound(false)
      setFetchedAssessment(null)

      try {
        await ensurePapersLoaded()
        if (props.assessmentId) {
          await ensureAssessmentsLoaded()
          const fromContext = assessments.find((a) => a.id === props.assessmentId)
          const resolved =
            fromContext ?? (await fetchAssessment(props.assessmentId).catch(() => null))
          if (cancelled) return
          if (!resolved) {
            setNotFound(true)
            return
          }
          setFetchedAssessment(resolved)
        } else if (props.paperId && !getPaper(props.paperId)) {
          if (!cancelled) setNotFound(true)
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [props.assessmentId, props.paperId, assessments, ensureAssessmentsLoaded, ensurePapersLoaded, getPaper])

  const assessment = props.assessmentId
    ? assessments.find((a) => a.id === props.assessmentId) ?? fetchedAssessment ?? undefined
    : undefined
  const paper = props.paperId ? getPaper(props.paperId) : undefined

  const questionIds = assessment?.selectedQuestionIds ?? paper?.questionIds ?? []
  const questions = getQuestionsByIds(questionIds)
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  if (pageLoading) {
    return (
      <AppCard className="text-center py-12">
        <p className="text-muted-foreground">Loading question paper…</p>
      </AppCard>
    )
  }

  if (notFound || (!assessment && !paper)) {
    return (
      <AppCard className="text-center py-12">
        <p className="text-muted-foreground">Question paper not found.</p>
      </AppCard>
    )
  }

  const title = assessment?.title ?? paper?.name ?? 'Question paper'
  const subtitle = assessment
    ? `${assessment.board} · ${assessment.grade} · ${assessment.subject} · ${assessment.mode} mode`
    : `${paper?.board} · ${paper?.grade} · ${paper?.subject} · Saved question paper`

  const coverageLabel =
    assessment?.paperCoverage === 'selected_topics'
      ? `Topic-wise (${assessment.selectedTopics?.length ?? 0} topic${(assessment.selectedTopics?.length ?? 0) !== 1 ? 's' : ''})`
      : assessment?.paperCoverage === 'full'
        ? 'Full question paper'
        : null

  const topicGroups = groupQuestionsByTopic(questions)
  let questionIndex = 0

  return (
    <>
      {showHeader && (
        <PageHeader
          eyebrow="Question paper preview"
          title={title}
          sub={subtitle}
          actions={
            <>
              <button
                type="button"
                className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                className="btn btn-primary gap-2 px-4 py-2 text-sm"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </>
          }
        />
      )}

      <AppCard className="max-w-3xl mx-auto">
        <div className="border-b border-ink pb-6 mb-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            BrightPath Academy · Question Paper
          </div>
          <div className="font-display text-3xl mt-3">{title}</div>
          <div className="text-sm text-muted-foreground mt-2">
            {assessment
              ? `${assessment.board} · ${assessment.grade} · ${assessment.subject} · ${assessment.batchName}`
              : `${paper?.board} · ${paper?.grade} · ${paper?.subject}`}
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs text-muted-foreground">
            {assessment && <span>Duration: {assessment.durationMinutes} minutes</span>}
            <span>Questions: {questions.length}</span>
            <span>Total marks: {totalMarks}</span>
            {coverageLabel && <span>Coverage: {coverageLabel}</span>}
            {assessment && <span>Date: {assessment.scheduledAt}</span>}
            {paper && <span>Created: {paper.createdAt}</span>}
          </div>
          {assessment?.paperCoverage === 'selected_topics' && assessment.selectedTopics && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {assessment.selectedTopics.map((topic) => (
                <span
                  key={topic}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4 max-w-lg mx-auto">
            Answer all questions. Each MCQ carries marks as indicated. No negative marking.
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No questions in this paper yet.</p>
        ) : (
          <div className="space-y-10">
            {topicGroups.map(([topic, topicQuestions]) => (
              <div key={topic}>
                <div className="mb-4 pb-2 border-b border-accent/30">
                  <h3 className="text-sm font-medium text-accent uppercase tracking-wide">
                    {topic}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {topicQuestions.length} question{topicQuestions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-y-8">
                  {topicQuestions.map((q) => {
                    questionIndex += 1
                    const num = questionIndex
                    return (
                      <div key={q.id} className="pb-6 border-b border-border last:border-0">
                        <div className="flex items-baseline justify-between gap-4 mb-2">
                          <div className="text-sm font-medium">
                            Q{num}. <span className="font-normal text-foreground">{q.text}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono-data text-xs text-muted-foreground">
                              [{q.marks} mark{q.marks !== 1 ? 's' : ''}]
                            </span>
                            {editable && paper && (
                              <button
                                type="button"
                                onClick={() => {
                                  void confirm({
                                    title: 'Delete question?',
                                    message: 'Delete this question from the bank? This cannot be undone.',
                                    confirmLabel: 'Delete',
                                    variant: 'danger',
                                  }).then((ok) => {
                                    if (ok) void removeQuestion(q.id)
                                  })
                                }}
                                className="text-rose hover:opacity-80"
                                aria-label="Delete question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {q.chapter} · {q.topic} · {q.difficulty} · {q.questionType.toUpperCase()}
                        </div>
                        {q.questionType === 'mcq' ? (
                          renderOptions(q)
                        ) : (
                          <div className="mt-4 space-y-6">
                            <div className="h-20 border border-dashed border-border rounded-md" />
                            <div className="h-20 border border-dashed border-border rounded-md" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-ink text-center text-xs text-muted-foreground">
          — End of question paper —
        </div>
      </AppCard>
    </>
  )
}
