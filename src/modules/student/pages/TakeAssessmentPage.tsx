import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight, FlaskConical, PartyPopper, Clock } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { PageLoader, PrismLoader } from '@/components/ui/PrismLoader'
import { btnClass } from '@/components/ui/Button'
import { useConfirmModal } from '@/components/ui/AppModal'
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
  fetchExamAttempt,
  saveExamAttempt,
} from '@/lib/api/assessmentsApi'
import { ApiError, isApiEnabled } from '@/lib/apiClient'
import { AuthImage } from '@/components/ui/AuthImage'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { shuffleQuestionsForStudent, mcqOptionsForDisplay } from '@/lib/shufflePaper'
import { clearExamProgress, loadExamProgress, saveExamProgress } from '@/lib/examProgress'
import { exitExamFullscreen } from '@/lib/examFullscreen'
import { getExamDeviceId } from '@/lib/examDevice'
import { useExamProctoring } from '@/modules/student/hooks/useExamProctoring'
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

const SAVE_LOADER_STEPS = [
  'Locking in your answers…',
  'Syncing every response…',
  'Sealing your attempt…',
  'Almost there — hang tight…',
]

function ThanksCard({
  title,
  submitting,
  error,
  terminated,
}: {
  title: string
  submitting?: boolean
  error?: boolean
  terminated?: boolean
}) {
  if (submitting) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center p-4 app-page-bg"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <AppCard className="text-center py-12 max-w-lg w-full">
          <motion.div
            className="flex flex-col items-center gap-2 px-2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium">
              Finishing up
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-foreground">{title}</h1>
            <PrismLoader
              size="lg"
              layout="block"
              label="Your assessment is being saved"
              steps={SAVE_LOADER_STEPS}
              className="py-6"
              aria-label="Saving assessment answers"
            />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Please stay on this page until saving completes. Navigation will unlock when your
              answers are safely stored.
            </p>
          </motion.div>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
      <AppCard className="text-center py-12 max-w-lg w-full space-y-4">
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-accent/15 text-accent grid place-items-center mx-auto"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            <PartyPopper className="w-7 h-7" />
          </motion.div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-medium mb-2">
              {terminated ? 'Exam ended' : 'Exam submitted'}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-foreground">{title}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            {terminated
              ? 'This exam was closed after repeated proctoring violations (leaving fullscreen, switching tabs, or losing focus). Your answers up to that point were submitted.'
              : 'Thanks for attending the exam. Please wait for your results — your tutor will share them when ready.'}
          </p>
          {error && (
            <p className="text-xs text-rose">
              Answers may not have synced. Contact your tutor if this persists.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/student/assessments"
              className={`${btnClass.primary} gap-2 px-4 py-2 text-sm`}
            >
              Back to assessments <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/student" className={`${btnClass.secondary} text-sm px-4 py-2`}>
              Go to Today
            </Link>
          </div>
        </motion.div>
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
    markAssessmentInProgress,
    refresh: refreshAssessments,
  } = useAssessments()
  const { studentProfile, refresh: refreshAnalytics } = useAnalytics()
  const { user } = useAuth()
  const { confirm } = useConfirmModal()
  const [questions, setQuestions] = useState<QuestionBankEntry[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [saveLabel, setSaveLabel] = useState('Answers save automatically')
  const allowLeaveRef = useRef(false)
  const disarmProctoringRef = useRef<() => void>(() => undefined)
  const [progressReady, setProgressReady] = useState(false)
  const autoAdvanceRef = useRef<number | null>(null)
  const finishingRef = useRef(false)
  const secondsLeftRef = useRef(0)
  const timerFromResumeRef = useRef(false)
  const selectionsRef = useRef<Record<string, string>>({})
  const indexRef = useRef(0)
  const flaggedRef = useRef<Set<string>>(new Set())
  const [examSecureLock, setExamSecureLock] = useState(false)
  const [terminatedByProctor, setTerminatedByProctor] = useState(false)

  const assessmentFromStore = assessments.find((a) => a.id === assessmentId)
  const [lockedAssessment, setLockedAssessment] = useState(assessmentFromStore)

  useEffect(() => {
    if (assessmentFromStore) setLockedAssessment(assessmentFromStore)
  }, [assessmentFromStore])

  const assessment = lockedAssessment ?? assessmentFromStore
  const isPractice = assessment?.mode === 'practice'
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set())
  const [visited, setVisited] = useState<Set<string>>(() => new Set())
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [finished, setFinished] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => (assessment?.durationMinutes ?? 15) * 60)

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
        // Only trust the server — stale local studentSubmitted after leave/login races
        // previously blocked resume until a full logout.
        if (existing) {
          setAlreadySubmitted(true)
          markAssessmentSubmitted(assessmentId)
          setQuestionsLoading(false)
          return
        }
        const qs = await fetchAssessmentQuestions(assessmentId)
        if (cancelled) return
        setQuestions(qs)

        const local = loadExamProgress(assessmentId, user.id)
        let attempt = null
        try {
          attempt = await fetchExamAttempt(assessmentId)
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            setAlreadySubmitted(true)
            markAssessmentSubmitted(assessmentId)
            setQuestionsLoading(false)
            return
          }
        }
        if (cancelled) return

        const fromApi: Record<string, string> = {}
        for (const ans of attempt?.answers ?? []) {
          if (ans.questionId && ans.selectedOption) fromApi[ans.questionId] = ans.selectedOption
        }
        const apiLive = Boolean(
          attempt &&
            (Object.keys(fromApi).length > 0 ||
              (attempt.currentIndex ?? 0) > 0 ||
              (attempt.flaggedIds?.length ?? 0) > 0 ||
              attempt.remainingSeconds != null),
        )
        const merged = { ...(local?.answers ?? {}), ...(apiLive ? fromApi : {}) }
        if (Object.keys(merged).length > 0) setSelections(merged)

        const flaggedMerged = new Set<string>([
          ...(local?.flaggedIds ?? []),
          ...(apiLive ? (attempt?.flaggedIds ?? []) : []),
        ])
        if (flaggedMerged.size > 0) setFlagged(flaggedMerged)

        const resumeIndex = apiLive
          ? (attempt?.currentIndex ?? 0)
          : (local?.currentIndex ?? 0)
        if (qs.length > 0) {
          setIndex(Math.max(0, Math.min(resumeIndex, qs.length - 1)))
        }

        const resumeSeconds = apiLive
          ? (attempt?.remainingSeconds ?? null)
          : (local?.remainingSeconds ?? null)
        if (resumeSeconds != null && resumeSeconds >= 0) {
          setSecondsLeft(resumeSeconds)
          timerFromResumeRef.current = true
        } else if (assessmentFromStore && assessmentFromStore.durationMinutes > 0) {
          setSecondsLeft(assessmentFromStore.durationMinutes * 60)
        }
        const visitedIds = new Set(Object.keys(merged))
        if (visitedIds.size > 0) setVisited(visitedIds)
        setProgressReady(true)
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
        if (!cancelled) {
          setQuestionsLoading(false)
          setProgressReady(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [assessmentId, markAssessmentSubmitted, user.id])

  const studentId = user.id
  const shuffleEnabled = Boolean(assessment?.shuffleQuestions)
  const displayQuestions = useMemo(
    () =>
      shuffleEnabled
        ? shuffleQuestionsForStudent(questions, assessmentId ?? '', studentId)
        : questions,
    [questions, assessmentId, studentId, shuffleEnabled],
  )

  const q = displayQuestions[index]
  const picked = q ? selections[q.id] ?? null : null
  const options = q
    ? mcqOptionsForDisplay(q, {
        shuffle: shuffleEnabled,
        assessmentId: assessmentId ?? '',
        studentId,
      })
    : []

  const attemptedCount = useMemo(
    () => displayQuestions.filter((question) => selections[question.id]).length,
    [displayQuestions, selections],
  )

  const flaggedIndices = useMemo(() => {
    const next = new Set<number>()
    displayQuestions.forEach((question, idx) => {
      if (flagged.has(question.id)) next.add(idx)
    })
    return next
  }, [displayQuestions, flagged])

  const board = assessment?.board ?? studentProfile?.board ?? 'CBSE'
  const grade = assessment?.grade ?? (studentProfile ? `Grade ${studentProfile.grade}` : 'Grade 8')
  const examLocked = Boolean(assessment && !isPractice && !finished && !alreadySubmitted)
  const timeWarning = Boolean(!isPractice && secondsLeft > 0 && secondsLeft <= 300)

  const getQuestionStatus = useCallback(
    (idx: number): QuestionGridStatus => {
      if (idx === index) return 'current'
      const question = displayQuestions[idx]
      if (question && selections[question.id]) return 'answered'
      if (question && visited.has(question.id)) return 'skipped'
      return 'unanswered'
    },
    [index, selections, displayQuestions, visited],
  )

  const hasAnswer = useCallback(
    (idx: number) => {
      const question = displayQuestions[idx]
      return Boolean(question && selections[question.id])
    },
    [displayQuestions, selections],
  )

  const goTo = useCallback((idx: number) => {
    if (examSecureLock) return
    if (autoAdvanceRef.current) {
      window.clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
    setIndex(idx)
    setShowFeedback(false)
  }, [examSecureLock])

  useEffect(() => {
    if (!q) return
    setVisited((prev) => {
      if (prev.has(q.id)) return prev
      const next = new Set(prev)
      next.add(q.id)
      return next
    })
  }, [q])

  const selectOption = useCallback(
    (key: string) => {
      if (examSecureLock || showFeedback || !q) return
      const alreadyAnswered = Boolean(selections[q.id])
      setSelections((prev) => ({ ...prev, [q.id]: key }))
      if (!isPractice && !alreadyAnswered && index < displayQuestions.length - 1) {
        if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current)
        autoAdvanceRef.current = window.setTimeout(() => goTo(index + 1), 380)
      }
    },
    [displayQuestions.length, examSecureLock, goTo, index, isPractice, q, selections, showFeedback],
  )

  const toggleFlag = () => {
    if (!q) return
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(q.id)) next.delete(q.id)
      else next.add(q.id)
      return next
    })
  }

  const finishExam = useCallback(
    (opts?: { skipConfirm?: boolean }) => {
      void (async () => {
        if (finishingRef.current) return
        if (!opts?.skipConfirm && !isPractice) {
          const unanswered = displayQuestions.filter((question) => !selections[question.id]).length
          const ok = await confirm({
            title: unanswered > 0 ? 'Submit with unanswered questions?' : 'Submit exam?',
            message:
              unanswered > 0
                ? `You still have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. After submit you cannot change answers.`
                : 'You cannot change answers after submit. Submit this exam now?',
            confirmLabel: 'Submit exam',
            variant: unanswered > 0 ? 'danger' : 'default',
          })
          if (!ok) return
        }
        finishingRef.current = true
        disarmProctoringRef.current()
        const records: AnswerRecord[] = displayQuestions.map((question) => {
          const choice = selections[question.id]
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
        // Set submitting BEFORE finished so the thanks screen never paints with nav buttons first.
        setSubmitState('submitting')
        setFinished(true)
        const saveStartedAt = Date.now()
        const MIN_SAVE_UI_MS = 1400
        const waitForSaveUi = async () => {
          const elapsed = Date.now() - saveStartedAt
          if (elapsed < MIN_SAVE_UI_MS) {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, MIN_SAVE_UI_MS - elapsed)
            })
          }
        }

        if (isApiEnabled() && assessment) {
          const durationMin = assessment.durationMinutes
          const spentMin =
            durationMin > 0
              ? Math.max(1, durationMin - Math.floor(secondsLeft / 60))
              : Math.max(1, Math.ceil((displayQuestions.length * 30) / 60))
          void submitAssessment(
            assessment.id,
            displayQuestions.map((question) => ({
              questionId: question.id,
              selectedOption: selections[question.id] ?? '',
            })),
            spentMin,
            isPractice ? undefined : getExamDeviceId(),
          )
            .then(async () => {
              await waitForSaveUi()
              allowLeaveRef.current = true
              setSubmitState('success')
              clearExamProgress(assessment.id, studentId)
              markAssessmentSubmitted(assessment.id)
              void refreshAssessments()
              void refreshAnalytics('studentAssessments')
            })
            .catch(async (e) => {
              await waitForSaveUi()
              if (e instanceof ApiError && e.status === 409) {
                allowLeaveRef.current = true
                setSubmitState('success')
                clearExamProgress(assessment.id, studentId)
                markAssessmentSubmitted(assessment.id)
                return
              }
              finishingRef.current = false
              allowLeaveRef.current = true
              setSubmitState('error')
            })
        } else if (assessmentId) {
          await waitForSaveUi()
          allowLeaveRef.current = true
          setSubmitState('success')
          clearExamProgress(assessmentId, studentId)
        } else {
          await waitForSaveUi()
          allowLeaveRef.current = true
          setSubmitState('success')
        }
      })()
    },
    [
      assessment,
      assessmentId,
      confirm,
      displayQuestions,
      isPractice,
      selections,
      secondsLeft,
      studentId,
      markAssessmentSubmitted,
      refreshAssessments,
      refreshAnalytics,
    ],
  )

  secondsLeftRef.current = secondsLeft
  selectionsRef.current = selections
  indexRef.current = index
  flaggedRef.current = flagged

  useEffect(() => {
    if (!progressReady || !assessment || isPractice) return
    if (timerFromResumeRef.current) return
    if (assessment.durationMinutes > 0) {
      timerFromResumeRef.current = true
      setSecondsLeft(assessment.durationMinutes * 60)
    }
  }, [assessment, isPractice, progressReady])

  useEffect(() => {
    if (
      !assessment ||
      finished ||
      isPractice ||
      assessment.durationMinutes <= 0 ||
      questionsLoading ||
      !progressReady
    ) {
      return
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer)
          window.setTimeout(() => finishExam({ skipConfirm: true }), 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [assessment, finished, isPractice, finishExam, questionsLoading, progressReady])

  const flushAttempt = useCallback(async () => {
    if (!assessmentId || !isApiEnabled() || isPractice) return
    await saveExamAttempt(assessmentId, {
      answers: Object.entries(selectionsRef.current).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      })),
      currentIndex: indexRef.current,
      flaggedIds: [...flaggedRef.current],
      remainingSeconds: secondsLeftRef.current,
      deviceId: getExamDeviceId(),
    }).catch(() => undefined)
  }, [assessmentId, isPractice])

  const handleProctorTerminated = useCallback(() => {
    setTerminatedByProctor(true)
    finishExam({ skipConfirm: true })
  }, [finishExam])

  const {
    sessionReady,
    sessionError,
    violationCount,
    maxViolations,
    requireFullscreen,
    resumeExamFocus,
    disarmProctoring,
  } = useExamProctoring({
    enabled: examLocked,
    assessmentId,
    onFlushAttempt: flushAttempt,
    onTerminated: handleProctorTerminated,
    onSecureLock: setExamSecureLock,
  })
  disarmProctoringRef.current = disarmProctoring

  const leaveExamForLater = useCallback(async () => {
    await flushAttempt()
    if (assessmentId) markAssessmentInProgress(assessmentId)
    disarmProctoring()
    allowLeaveRef.current = true
    await exitExamFullscreen()
    void refreshAssessments()
  }, [assessmentId, disarmProctoring, flushAttempt, markAssessmentInProgress, refreshAssessments])

  useEffect(() => {
    if (
      !progressReady ||
      !assessmentId ||
      isPractice ||
      finished ||
      alreadySubmitted ||
      questions.length === 0
    ) {
      return
    }
    saveExamProgress(studentId, {
      assessmentId,
      answers: selections,
      flaggedIds: [...flagged],
      currentIndex: index,
      remainingSeconds: secondsLeft,
      savedAt: Date.now(),
    })
  }, [
    assessmentId,
    alreadySubmitted,
    finished,
    flagged,
    index,
    isPractice,
    progressReady,
    questions.length,
    secondsLeft,
    selections,
    studentId,
  ])

  useEffect(() => {
    if (
      !progressReady ||
      !isApiEnabled() ||
      !assessmentId ||
      isPractice ||
      finished ||
      alreadySubmitted ||
      questions.length === 0 ||
      !sessionReady
    ) {
      return
    }
    setSaveLabel('Saving…')
    const timer = window.setTimeout(() => {
      void saveExamAttempt(assessmentId, {
        answers: Object.entries(selections).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption,
        })),
        currentIndex: index,
        flaggedIds: [...flagged],
        remainingSeconds: secondsLeftRef.current,
        deviceId: getExamDeviceId(),
      })
        .then(() => setSaveLabel('Saved'))
        .catch(() => setSaveLabel('Saved on this device'))
    }, 500)
    return () => window.clearTimeout(timer)
  }, [
    alreadySubmitted,
    assessmentId,
    finished,
    flagged,
    index,
    isPractice,
    progressReady,
    questions.length,
    selections,
    sessionReady,
  ])

  useEffect(() => {
    if (
      !progressReady ||
      !isApiEnabled() ||
      !assessmentId ||
      isPractice ||
      finished ||
      alreadySubmitted ||
      questions.length === 0 ||
      !sessionReady
    ) {
      return
    }
    const timer = window.setInterval(() => {
      void saveExamAttempt(assessmentId, {
        answers: Object.entries(selectionsRef.current).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption,
        })),
        currentIndex: indexRef.current,
        flaggedIds: [...flaggedRef.current],
        remainingSeconds: secondsLeftRef.current,
        deviceId: getExamDeviceId(),
      }).catch(() => undefined)
    }, 15000)
    return () => window.clearInterval(timer)
  }, [alreadySubmitted, assessmentId, finished, isPractice, progressReady, questions.length, sessionReady])

  const requestExit = useCallback(async () => {
    if (allowLeaveRef.current) {
      disarmProctoring()
      await exitExamFullscreen()
      navigate('/student/assessments')
      return true
    }
    const ok = await confirm({
      title: 'Leave the exam?',
      message:
        'Your answers are saved. You can come back and continue as long as the exam time is still open. You cannot change answers after you submit.',
      confirmLabel: 'Leave and resume later',
      cancelLabel: 'Stay in exam',
    })
    if (!ok) return false
    await leaveExamForLater()
    navigate('/student/assessments')
    return true
  }, [confirm, disarmProctoring, leaveExamForLater, navigate])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      examLocked &&
      !allowLeaveRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (allowLeaveRef.current) {
      blocker.proceed()
      return
    }
    let active = true
    void (async () => {
      const ok = await confirm({
        title: 'Leave the exam?',
        message:
          'Your answers are saved. You can come back and continue as long as the exam time is still open.',
        confirmLabel: 'Leave and resume later',
        cancelLabel: 'Stay in exam',
      })
      if (!active) return
      if (ok) {
        await leaveExamForLater()
        blocker.proceed()
      } else {
        blocker.reset()
      }
    })()
    return () => {
      active = false
    }
  }, [blocker, confirm, leaveExamForLater])

  useEffect(() => {
    if (finished || alreadySubmitted) {
      disarmProctoring()
      void exitExamFullscreen()
    }
  }, [alreadySubmitted, disarmProctoring, finished])

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current)
    }
  }, [])

  const goNext = useCallback(() => {
    if (examSecureLock) return
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
      if (index >= displayQuestions.length - 1) {
        finishExam()
      } else {
        goTo(index + 1)
      }
      return
    }
    if (index >= displayQuestions.length - 1) {
      finishExam()
    } else {
      goTo(index + 1)
    }
  }, [examSecureLock, finishExam, goTo, index, isPractice, picked, q, displayQuestions.length, showFeedback])

  const goPrevious = () => {
    if (index > 0) goTo(index - 1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished || showFeedback || examSecureLock) return
      const optionKeys = ['1', '2', '3', '4', 'a', 'b', 'c', 'd']
      const optionIndex = optionKeys.indexOf(e.key.toLowerCase())
      if (optionIndex >= 0) {
        const mapped = optionIndex > 3 ? optionIndex - 4 : optionIndex
        const opt = options[mapped]
        if (opt) {
          e.preventDefault()
          selectOption(opt.originalKey)
        }
        return
      }
      if (e.key === 'Enter' && picked) {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [examSecureLock, finished, goNext, options, picked, selectOption, showFeedback])

  if (alreadySubmitted) {
    return <ThanksCard title={assessment?.title ?? 'Assessment'} />
  }

  if (finished && assessment && !isPractice) {
    return (
      <ThanksCard
        title={assessment.title}
        submitting={submitState === 'submitting' || submitState === 'idle'}
        error={submitState === 'error'}
        terminated={terminatedByProctor}
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

  if (!isPractice && sessionError) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className="text-center py-12 max-w-md w-full space-y-4">
          <p className="font-display text-lg text-foreground">{assessment.title}</p>
          <p className="text-sm text-muted-foreground">{sessionError}</p>
          <p className="text-xs text-muted-foreground">
            Close the exam on the other device, or ask your tutor if you need help.
          </p>
          <Link to="/student/assessments" className="text-sm text-accent inline-block">
            Back to assessments
          </Link>
        </AppCard>
      </div>
    )
  }

  if (!isPractice && !sessionReady && isApiEnabled() && !finished && !alreadySubmitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 app-page-bg">
        <AppCard className="text-center py-12 max-w-md w-full">
          <PageLoader label="Securing exam session…" minHeight={false} className="py-4" />
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
  const isLast = index >= displayQuestions.length - 1
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
      totalQuestions={displayQuestions.length}
      attemptedCount={attemptedCount}
      timeLabel={!isPractice ? formatTime(secondsLeft) : undefined}
      timeWarning={timeWarning}
      saveLabel={!isPractice ? saveLabel : undefined}
      flagged={flaggedIndices}
      getQuestionStatus={getQuestionStatus}
      hasAnswer={hasAnswer}
      onJumpTo={goTo}
      onPrevious={goPrevious}
      onNext={goNext}
      canPrevious={index > 0}
      canNext={isPractice ? showFeedback || Boolean(picked) : true}
      nextLabel={nextLabel}
      paletteOpen={paletteOpen}
      onPaletteOpenChange={setPaletteOpen}
      lockExit={examLocked}
      onRequestExit={() => void requestExit()}
      secureGate={
        examLocked && examSecureLock
          ? {
              title:
                violationCount > 0
                  ? `Proctoring warning ${violationCount} of ${maxViolations}`
                  : requireFullscreen
                    ? 'Fullscreen required'
                    : 'Return to the exam',
              message:
                violationCount > 0
                  ? `Leaving the exam tab, window, or fullscreen counts as a violation. After ${maxViolations} violations the exam is submitted automatically. Return to fullscreen to continue — the timer keeps running.`
                  : requireFullscreen
                    ? 'This exam must stay in fullscreen. Switching tabs or leaving fullscreen pauses answering until you return. The timer keeps running.'
                    : 'You left the exam. Stay on this tab until you submit. The timer keeps running and your answers stay saved.',
              resumeLabel: requireFullscreen ? 'Enter fullscreen' : 'Continue exam',
              onResume: () => void resumeExamFocus(),
            }
          : null
      }
    >
      <ExamQuestionCard
        questionNumber={index + 1}
        totalQuestions={displayQuestions.length}
        isFlagged={Boolean(q && flagged.has(q.id))}
        onToggleFlag={toggleFlag}
      >
        <p className="text-base sm:text-lg lg:text-xl text-foreground font-semibold leading-relaxed mb-5 sm:mb-7 text-left w-full">
          {q.text && q.text !== '(image)' ? q.text : null}
        </p>
        {q.textImageUrl && (
          <div className="mb-5 sm:mb-6 w-full">
            <AuthImage mediaPath={q.textImageUrl} className="max-h-[min(50vh,28rem)]" alt="Question" />
          </div>
        )}

        {showScienceVisual && !q.textImageUrl && (
          <div className="mb-5 sm:mb-6 rounded-xl overflow-hidden border border-border bg-gradient-to-br from-teal-50 to-cyan-100 aspect-[16/7] sm:aspect-[16/6] flex items-center justify-center">
            <div className="text-center px-4">
              <FlaskConical className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600/70 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-teal-800/60">Figure — {q.chapter}</p>
            </div>
          </div>
        )}

        <div className="space-y-3 w-full">
          {options.map((opt) => {
            const selected = picked === opt.originalKey
            const showResult = showFeedback && isPractice
            const isRight = q.correctAnswer === opt.originalKey
            return (
              <button
                key={opt.originalKey}
                type="button"
                disabled={showFeedback}
                onClick={() => selectOption(opt.originalKey)}
                className={cn(
                  'w-full flex items-start gap-4 text-left px-5 py-4 sm:py-5 rounded-xl border-2 bg-card transition-all',
                  selected && !showResult && 'border-ink bg-ink/5 ring-1 ring-ink/15',
                  showResult && isRight && 'border-leaf bg-leaf/10',
                  showResult && selected && !isRight && 'border-rose bg-rose/10',
                  !selected && !showResult && 'border-border hover:border-gold-400 hover:bg-gold-50/40',
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center font-bold text-xs',
                    selected ? 'border-ink bg-ink text-paper' : 'border-border text-muted-foreground',
                  )}
                >
                  {opt.displayKey}
                </span>
                <span className="text-sm sm:text-base text-foreground font-medium text-left flex-1 space-y-2">
                  {opt.label}
                  {opt.imageUrl && (
                    <AuthImage mediaPath={opt.imageUrl} className="max-h-40 mt-2" alt={`Option ${opt.displayKey}`} />
                  )}
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
          {q.marks} mark{q.marks !== 1 ? 's' : ''}
        </p>
      </ExamQuestionCard>
    </AssessmentExamLayout>
  )
}