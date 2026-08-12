import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, X, ArrowRight, FlaskConical, PartyPopper, Clock } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { btnClass } from '@/components/ui/Button'
import {
  AssessmentExamLayout,
  ExamQuestionCard,
  type QuestionGridStatus,
} from '@/modules/student/components/AssessmentExamLayout'
import { useAssessments } from '@/hooks/useAssessments'
import {
  submitAssessment,
  fetchAssessmentQuestions,
  fetchMySubmission,
} from '@/lib/api/assessmentsApi'
import { ApiError, isApiEnabled } from '@/lib/apiClient'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/cn'
import {
  AccessRequestStatusBadge,
  accessRequestTheme,
  accessRequestToneStyles,
  descriptionForAccessRequestStatus,
  toneForAccessRequestStatus,
} from '@/lib/accessRequestTheme'

import type { QuestionBankEntry } from '@/types'

type AnswerRecord = { questionId: string; correct: boolean; topic: string }

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function buildOptions(q: {
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
}) {
  if (q.optionA && q.optionB) {
    return [
      { key: 'A', label: q.optionA },
      { key: 'B', label: q.optionB },
      ...(q.optionC ? [{ key: 'C', label: q.optionC }] : []),
      ...(q.optionD ? [{ key: 'D', label: q.optionD }] : []),
    ]
  }
  return [
    { key: 'A', label: 'Option A' },
    { key: 'B', label: 'Option B' },
    { key: 'C', label: 'Option C' },
    { key: 'D', label: 'Option D' },
  ]
}

function ThanksCard({
  title,
  submitting,
  error,
}: {
  title: string
  submitting?: boolean
  error?: boolean
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
      <AppCard className="text-center py-12 max-w-lg w-full space-y-4">
        <div className="w-14 h-14 rounded-full bg-accent/15 text-accent grid place-items-center mx-auto">
          <PartyPopper className="w-7 h-7" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium mb-2">
            Exam submitted
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">{title}</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          Thanks for attending the exam. Please wait for your results — your tutor will share them
          when ready.
        </p>
        {submitting && (
          <p className="text-xs text-muted-foreground">Saving your answers…</p>
        )}
        {error && (
          <p className="text-xs text-rose">
            Answers may not have synced. Contact your tutor if this persists.
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/student/assessments" className={`${btnClass.primary} gap-2 px-4 py-2 text-sm`}>
            Back to assessments <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/student" className={`${btnClass.secondary} text-sm px-4 py-2`}>
            Go to Today
          </Link>
        </div>
      </AppCard>
    </div>
  )
}

export function StudentTakeAssessmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const navigate = useNavigate()
  const {
    assessments,
    markAssessmentSubmitted,
    refresh: refreshAssessments,
  } = useAssessments()
  const { studentProfile, refresh: refreshAnalytics } = useAnalytics()
  const [questions, setQuestions] = useState<QuestionBankEntry[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const assessmentFromStore = assessments.find((a) => a.id === assessmentId)
  const [lockedAssessment, setLockedAssessment] = useState(assessmentFromStore)

  useEffect(() => {
    if (assessmentFromStore) setLockedAssessment(assessmentFromStore)
  }, [assessmentFromStore])

  const assessment = lockedAssessment ?? assessmentFromStore

  useEffect(() => {
    if (!assessmentId || !isApiEnabled()) {
      setQuestionsLoading(false)
      return
    }

    let cancelled = false
    setQuestionsLoading(true)
    setQuestionsError(null)

    void (async () => {
      try {
        const existing = await fetchMySubmission(assessmentId)
        if (cancelled) return
        if (existing || assessmentFromStore?.studentSubmitted) {
          setAlreadySubmitted(true)
          markAssessmentSubmitted(assessmentId)
          setQuestionsLoading(false)
          return
        }
        const qs = await fetchAssessmentQuestions(assessmentId)
        if (cancelled) return
        setQuestions(qs)
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiError && e.status === 409) {
          setAlreadySubmitted(true)
          markAssessmentSubmitted(assessmentId)
          setQuestionsError(null)
        } else {
          setQuestions([])
          const msg = e instanceof Error ? e.message : 'Failed to load questions'
          setQuestionsError(msg)
        }
      } finally {
        if (!cancelled) setQuestionsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [assessmentId, assessmentFromStore?.studentSubmitted, markAssessmentSubmitted])

  const isPractice = assessment?.mode === 'practice'
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set())
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [finished, setFinished] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => (assessment?.durationMinutes ?? 15) * 60)

  const q = questions[index]
  const picked = selections[index] ?? null
  const options = q ? buildOptions(q) : []

  const attemptedCount = useMemo(
    () => Object.keys(selections).filter((k) => selections[Number(k)]).length,
    [selections],
  )

  const board = assessment?.board ?? studentProfile?.board ?? 'CBSE'
  const grade = assessment?.grade ?? (studentProfile ? `Grade ${studentProfile.grade}` : 'Grade 8')

  const getQuestionStatus = useCallback(
    (idx: number): QuestionGridStatus => {
      if (idx === index) return 'current'
      if (selections[idx]) return 'answered'
      return 'unanswered'
    },
    [index, selections],
  )

  const hasAnswer = useCallback((idx: number) => Boolean(selections[idx]), [selections])

  const goTo = useCallback((idx: number) => {
    setIndex(idx)
    setShowFeedback(false)
  }, [])

  const selectOption = (key: string) => {
    if (showFeedback) return
    setSelections((prev) => ({ ...prev, [index]: key }))
  }

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const finishExam = useCallback(() => {
    const records: AnswerRecord[] = questions.map((question, idx) => {
      const choice = selections[idx]
      const correct = question.correctAnswer
        ? choice === question.correctAnswer
        : choice === 'B'
      return {
        questionId: question.id,
        correct: Boolean(choice && correct),
        topic: question.topic,
      }
    })
    setAnswers(records)
    setFinished(true)

    if (isApiEnabled() && assessment) {
      const durationMin = assessment.durationMinutes
      const spentMin =
        durationMin > 0
          ? Math.max(1, durationMin - Math.floor(secondsLeft / 60))
          : Math.max(1, Math.ceil((questions.length * 30) / 60))
      setSubmitState('submitting')
      void submitAssessment(
        assessment.id,
        questions.map((question, idx) => ({
          questionId: question.id,
          selectedOption: selections[idx] ?? '',
        })),
        spentMin,
      )
        .then(async () => {
          setSubmitState('success')
          markAssessmentSubmitted(assessment.id)
          void refreshAssessments()
          void refreshAnalytics('studentAssessments')
        })
        .catch((e) => {
          if (e instanceof ApiError && e.status === 409) {
            setSubmitState('success')
            markAssessmentSubmitted(assessment.id)
            return
          }
          setSubmitState('error')
        })
    }
  }, [
    assessment,
    questions,
    selections,
    secondsLeft,
    markAssessmentSubmitted,
    refreshAssessments,
    refreshAnalytics,
  ])

  useEffect(() => {
    if (!assessment || finished || isPractice || assessment.durationMinutes <= 0) return
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer)
          window.setTimeout(() => finishExam(), 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [assessment, finished, isPractice, finishExam])

  const goNext = useCallback(() => {
    if (isPractice && picked && !showFeedback) {
      const correct = q?.correctAnswer ? picked === q.correctAnswer : picked === 'B'
      setAnswers((prev) => [
        ...prev,
        { questionId: q!.id, correct, topic: q!.topic },
      ])
      setShowFeedback(true)
      return
    }
    if (isPractice && showFeedback) {
      if (index >= questions.length - 1) {
        finishExam()
      } else {
        goTo(index + 1)
      }
      return
    }
    if (index >= questions.length - 1) {
      finishExam()
    } else {
      goTo(index + 1)
    }
  }, [finishExam, goTo, index, isPractice, picked, q, questions.length, showFeedback])

  const goPrevious = () => {
    if (index > 0) goTo(index - 1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished || showFeedback) return
      if (e.key === 'Enter' && picked) {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finished, goNext, picked, showFeedback])

  if (alreadySubmitted || assessment?.studentSubmitted) {
    return <ThanksCard title={assessment?.title ?? 'Assessment'} />
  }

  if (finished && assessment && !isPractice) {
    return (
      <ThanksCard
        title={assessment.title}
        submitting={submitState === 'submitting'}
        error={submitState === 'error'}
      />
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className="text-center py-12 max-w-md w-full">
          <p className="text-muted-foreground">Assessment not found.</p>
          <Link to="/student/assessments" className="text-sm text-accent mt-4 inline-block">
            Back to assessments
          </Link>
        </AppCard>
      </div>
    )
  }

  if (assessment.timingOver && assessment.accessRequestStatus !== 'approved') {
    const tone = toneForAccessRequestStatus(assessment.accessRequestStatus)
    const styles = accessRequestToneStyles[tone]
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className={`text-center py-12 max-w-md w-full space-y-4 border-2 ${styles.section}`}>
          <div className={`w-14 h-14 rounded-full grid place-items-center mx-auto ${styles.icon}`}>
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <AccessRequestStatusBadge
              status={assessment.accessRequestStatus}
              emphasis={assessment.accessRequestStatus === 'pending'}
              className="mb-3"
            />
            <p className="text-[11px] uppercase tracking-[0.2em] font-medium mb-2 text-muted-foreground">
              Exam timing over
            </p>
            <h1 className="font-display text-xl text-foreground">{assessment.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The deadline to attend this exam has passed
            {assessment.availableUntil ? ` (${assessment.availableUntil})` : ''}.{' '}
            {descriptionForAccessRequestStatus(assessment.accessRequestStatus)}
          </p>
          <Link to="/student/assessments" className={`${btnClass.primary} inline-flex gap-2 px-4 py-2 text-sm`}>
            Back to assessments <ArrowRight className="w-4 h-4" />
          </Link>
        </AppCard>
      </div>
    )
  }

  if (assessment.status !== 'live' && assessment.accessRequestStatus !== 'approved') {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className="text-center py-12 max-w-md w-full space-y-3">
          <p className="font-display text-lg text-foreground">{assessment.title}</p>
          <p className="text-sm text-muted-foreground">
            This assessment has not started yet. Your tutor will go live when it is time to begin.
          </p>
          <Link to="/student/assessments" className="text-sm text-accent mt-2 inline-block">
            Back to assessments
          </Link>
        </AppCard>
      </div>
    )
  }

  if (questionsLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className="text-center py-12 max-w-md w-full">
          <PageLoader label="Loading assessment questions…" minHeight={false} className="py-4" />
        </AppCard>
      </div>
    )
  }

  if (questionsError) {
    const timingOver = questionsError.toLowerCase().includes('timing over')
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className="text-center py-12 max-w-md w-full space-y-4">
          {timingOver && (
            <div className={`w-14 h-14 rounded-full grid place-items-center mx-auto ${accessRequestTheme.icon}`}>
              <Clock className="w-7 h-7" />
            </div>
          )}
          <p className="text-muted-foreground">{questionsError}</p>
          <Link to="/student/assessments" className="text-sm text-accent mt-4 inline-block">
            Back to assessments
          </Link>
        </AppCard>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className="text-center py-12 max-w-md w-full">
          <p className="text-muted-foreground">No questions assigned to this assessment yet.</p>
          <Link to="/student/assessments" className="text-sm text-accent mt-4 inline-block">
            Back to assessments
          </Link>
        </AppCard>
      </div>
    )
  }

  if (finished && isPractice) {
    const correct = answers.filter((a) => a.correct).length
    const pct = answers.length ? Math.round((correct / answers.length) * 100) : 0
    const weakTopics = [...new Set(answers.filter((a) => !a.correct).map((a) => a.topic))]

    return (
      <div className="min-h-dvh app-page-bg overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium mb-2">
              Practice complete
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-foreground">
              {assessment.title}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Instant feedback for practice mode.
            </p>
          </div>

          <AppCard className="mb-6 bg-ink text-paper">
            <div className="text-[10px] uppercase tracking-widest text-accent">Session score</div>
            <div className="font-mono-data text-5xl sm:text-6xl font-bold mt-2">{pct}%</div>
            <p className="text-paper/70 mt-2 text-sm">
              {correct} of {answers.length} correct · {assessment.subject} · {board} {grade}
            </p>
            {weakTopics.length > 0 && (
              <p className="text-sm text-paper/80 mt-4">Work on: {weakTopics.join(', ')}</p>
            )}
          </AppCard>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/student/assessments')}
              className={`${btnClass.primary} text-sm px-4 py-2`}
            >
              Back to assessments
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isCorrect = picked !== null && q.correctAnswer && picked === q.correctAnswer
  const showScienceVisual = q.subject === 'Science'
  const isLast = index >= questions.length - 1
  const nextLabel = isPractice
    ? showFeedback
      ? isLast
        ? 'Finish'
        : 'Next Question'
      : 'Check'
    : isLast
      ? 'Submit'
      : 'Next Question'

  return (
    <AssessmentExamLayout
      board={board}
      grade={grade}
      title={assessment.title}
      currentIndex={index}
      totalQuestions={questions.length}
      attemptedCount={attemptedCount}
      timeLabel={!isPractice ? formatTime(secondsLeft) : undefined}
      flagged={flagged}
      getQuestionStatus={getQuestionStatus}
      hasAnswer={hasAnswer}
      onJumpTo={goTo}
      onPrevious={goPrevious}
      onNext={goNext}
      canPrevious={index > 0}
      canNext={isPractice ? showFeedback || Boolean(picked) : Boolean(picked)}
      nextLabel={nextLabel}
      paletteOpen={paletteOpen}
      onPaletteOpenChange={setPaletteOpen}
    >
      <ExamQuestionCard
        questionNumber={index + 1}
        totalQuestions={questions.length}
        isFlagged={flagged.has(index)}
        onToggleFlag={toggleFlag}
      >
        <p className="text-base sm:text-lg lg:text-xl text-foreground font-semibold leading-relaxed mb-5 sm:mb-7 text-left w-full">
          {q.text}
        </p>

        {showScienceVisual && (
          <div className="mb-5 sm:mb-6 rounded-xl overflow-hidden border border-border bg-gradient-to-br from-teal-50 to-cyan-100 aspect-[16/7] sm:aspect-[16/6] flex items-center justify-center">
            <div className="text-center px-4">
              <FlaskConical className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600/70 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-teal-800/60">Figure — {q.chapter}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 w-full">
          {options.map((opt) => {
            const selected = picked === opt.key
            const showResult = showFeedback && isPractice
            const isRight = q.correctAnswer === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                disabled={showFeedback}
                onClick={() => selectOption(opt.key)}
                className={cn(
                  'w-full flex items-start gap-4 text-left px-5 py-4 sm:py-5 rounded-xl border-2 bg-card transition-all',
                  selected && !showResult && 'border-ink bg-ink/5 ring-1 ring-ink/20 shadow-card',
                  showResult && isRight && 'border-leaf bg-leaf/10',
                  showResult && selected && !isRight && 'border-rose bg-rose/10',
                  !selected && !showResult && 'border-border hover:border-ink/40 hover:bg-secondary/40',
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center font-bold text-xs',
                    selected ? 'border-ink bg-ink text-paper' : 'border-muted-foreground/40 text-muted-foreground',
                  )}
                >
                  {opt.key}
                </span>
                <span className="text-sm sm:text-base text-foreground font-medium text-left flex-1">
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>

        {showFeedback && isPractice && (
          <div
            className={cn(
              'mt-4 p-4 rounded-xl flex items-start gap-2 text-sm',
              isCorrect ? 'bg-leaf/10 text-leaf' : 'bg-rose/10 text-rose',
            )}
          >
            {isCorrect ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
            <span>
              {isCorrect
                ? 'Correct — nice work.'
                : 'Not quite — review the concept and try similar problems.'}
            </span>
          </div>
        )}

        <p className="mt-4 text-[10px] sm:text-xs text-muted-foreground">
          {q.chapter} · {q.topic} · {q.marks} mark{q.marks !== 1 ? 's' : ''}
        </p>
      </ExamQuestionCard>
    </AssessmentExamLayout>
  )
}