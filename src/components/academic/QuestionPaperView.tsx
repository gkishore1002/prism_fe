import { useEffect, useState } from 'react'
import { Download, Loader2, Printer, Trash2 } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { AuthImage } from '@/components/ui/AuthImage'
import { useAssessments } from '@/hooks/useAssessments'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { fetchAssessment } from '@/lib/api/assessmentsApi'
import { useConfirmModal } from '@/components/ui/AppModal'
import {
  downloadQuestionPaperPdf,
  printQuestionPaper,
  QUESTION_PAPER_PRINT_ROOT_ID,
} from '@/lib/questionPaperPrint'
import type { QuestionBankEntry, TutorAssessmentSchedule } from '@/types'
import { formatSubjects } from '@/lib/formatSubjects'
import { MathContent } from '@/components/math/MathContent'
import { toQuestionMediaFetchPath } from '@/lib/questionMedia'

function renderOptions(q: QuestionBankEntry) {
  const opts = [
    (q.optionA || q.optionAImageUrl || q.optionAImageKey) && {
      key: 'A',
      label: q.optionA,
      imageUrl: toQuestionMediaFetchPath(q.optionAImageUrl, q.optionAImageKey),
    },
    (q.optionB || q.optionBImageUrl || q.optionBImageKey) && {
      key: 'B',
      label: q.optionB,
      imageUrl: toQuestionMediaFetchPath(q.optionBImageUrl, q.optionBImageKey),
    },
    (q.optionC || q.optionCImageUrl || q.optionCImageKey) && {
      key: 'C',
      label: q.optionC,
      imageUrl: toQuestionMediaFetchPath(q.optionCImageUrl, q.optionCImageKey),
    },
    (q.optionD || q.optionDImageUrl || q.optionDImageKey) && {
      key: 'D',
      label: q.optionD,
      imageUrl: toQuestionMediaFetchPath(q.optionDImageUrl, q.optionDImageKey),
    },
  ].filter(Boolean) as { key: string; label?: string; imageUrl?: string }[]

  if (opts.length === 0) {
    return (
      <div className="mt-3 h-16 border border-dashed border-border rounded-md bg-secondary/30" />
    )
  }

  return (
    <div className="mt-3 grid sm:grid-cols-2 gap-2">
      {opts.map((opt) => (
        <div key={opt.key} className="text-sm px-3 py-2 rounded-md border border-border space-y-2">
          <span className="font-mono-data text-xs text-muted-foreground mr-2">{opt.key}.</span>
          {opt.label ? <MathContent text={opt.label} /> : null}
          {opt.imageUrl && <AuthImage mediaPath={opt.imageUrl} className="max-h-40 mt-1" alt={`Option ${opt.key}`} />}
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
  const [exportBusy, setExportBusy] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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
    ? `${assessment.board} · ${assessment.grade} · ${formatSubjects(assessment.subjects, assessment.subject)} · ${assessment.mode} mode`
    : `${paper?.board} · ${paper?.grade} · ${formatSubjects(paper?.subjects, paper?.subject)} · Saved question paper`

  const coverageLabel =
    assessment?.paperCoverage === 'selected_topics'
      ? `Topic-wise (${assessment.selectedTopics?.length ?? 0} topic${(assessment.selectedTopics?.length ?? 0) !== 1 ? 's' : ''})`
      : assessment?.paperCoverage === 'full'
        ? 'Full question paper'
        : null

  function handlePrint() {
    setExportError(null)
    printQuestionPaper({ title })
  }

  async function handleDownloadPdf() {
    if (exportBusy) return
    setExportBusy(true)
    setExportError(null)
    try {
      await downloadQuestionPaperPdf({ title })
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Failed to download PDF')
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <>
      {showHeader && (
        <PageHeader
          eyebrow="Question paper preview"
          title={title}
          sub={subtitle}
          actions={
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                disabled={exportBusy || questions.length === 0}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary disabled:opacity-60"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={exportBusy || questions.length === 0}
                className="btn btn-primary gap-2 px-4 py-2 text-sm disabled:opacity-60"
              >
                {exportBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exportBusy ? 'Preparing…' : 'Download PDF'}
              </button>
            </div>
          }
        />
      )}

      {exportError && (
        <p className="mb-4 text-sm text-rose print:hidden">{exportError}</p>
      )}

      <div id={QUESTION_PAPER_PRINT_ROOT_ID} className="question-paper-print-root max-w-3xl mx-auto">
      <AppCard className="max-w-none">
        <div className="border-b border-ink pb-6 mb-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            BrightPath Academy · Question Paper
          </div>
          <div className="font-display text-3xl mt-3">{title}</div>
          <div className="text-sm text-muted-foreground mt-2">
            {assessment
              ? `${assessment.board} · ${assessment.grade} · ${formatSubjects(assessment.subjects, assessment.subject)} · ${assessment.batchName}`
              : `${paper?.board} · ${paper?.grade} · ${formatSubjects(paper?.subjects, paper?.subject)}`}
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs text-muted-foreground">
            {assessment && <span>Duration: {assessment.durationMinutes} minutes</span>}
            <span>Questions: {questions.length}</span>
            <span>Total marks: {totalMarks}</span>
            {coverageLabel && <span>Coverage: {coverageLabel}</span>}
            {assessment && <span>Date: {assessment.scheduledAt}</span>}
            {paper && <span>Created: {paper.createdAt}</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-4 max-w-lg mx-auto">
            Answer all questions. Each MCQ carries marks as indicated. No negative marking.
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No questions in this paper yet.</p>
        ) : (
          <div className="space-y-8">
            {questions.map((q, idx) => (
              <div key={q.id} className="pb-6 border-b border-border last:border-0 break-inside-avoid">
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <div className="text-sm font-medium space-y-2">
                    <div>
                      Q{idx + 1}.{' '}
                      {q.text && q.text !== '(image)' && (
                        <span className="font-normal text-foreground">
                          <MathContent text={q.text} />
                        </span>
                      )}
                    </div>
                    {(q.textImageUrl || q.textImageKey) && (
                      <AuthImage
                        mediaPath={q.textImageUrl}
                        mediaKey={q.textImageKey}
                        className="max-h-64"
                        alt={`Question ${idx + 1}`}
                      />
                    )}
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
                        className="text-rose hover:opacity-80 print:hidden"
                        aria-label="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {q.chapter} · {q.difficulty} · {q.questionType.toUpperCase()}
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
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-ink text-center text-xs text-muted-foreground">
          — End of question paper —
        </div>
      </AppCard>
      </div>
    </>
  )
}
