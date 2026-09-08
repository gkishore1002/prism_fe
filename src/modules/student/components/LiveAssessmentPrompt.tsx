import { useEffect } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics } from '@/hooks/useAnalytics'
import { resolveStudentProfile } from '@/modules/student/lib/studentProfile'
import { ExamStartButton } from '@/modules/student/components/ExamStartButton'

/** Live assessments the student can start now (not submitted, not timing over). */
export function useLiveStudentAssessments() {
  const { user } = useAuth()
  const { getAssessmentsForStudent, canStudentAttend, loading } = useAssessments()
  const { studentProfile, loading: analyticsLoading } = useAnalytics()

  const profile = resolveStudentProfile(studentProfile, user)
  if (!profile || loading || analyticsLoading) {
    return { liveAssessments: [], loading: loading || analyticsLoading, profile: null }
  }

  const query = {
    studentId: profile.id || user.id,
    board: profile.board || 'CBSE',
    grade: profile.grade || 'Grade 8',
  }

  const liveAssessments = getAssessmentsForStudent(query).filter(
    (a) =>
      !a.studentSubmitted &&
      !a.timingOver &&
      (a.attemptInProgress ||
        (a.status === 'live' && (a.canAttend ?? canStudentAttend(query, a.id)))),
  )

  return { liveAssessments, loading: false, profile, query, canStudentAttend }
}

interface LiveAssessmentPromptProps {
  className?: string
}

/** Prominent call-to-action when a live assessment is waiting. */
export function LiveAssessmentPrompt({ className }: LiveAssessmentPromptProps) {
  const { liveAssessments, loading } = useLiveStudentAssessments()
  const { ensureLoaded, refresh } = useAssessments()
  const { load } = useAnalytics()

  useEffect(() => {
    void ensureLoaded()
    void load('studentAssessments')
  }, [ensureLoaded, load])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  if (loading || liveAssessments.length === 0) return null

  const first = liveAssessments[0]

  return (
    <div
      className={`bg-ink text-paper rounded-lg p-6 sm:p-8 mb-8 relative overflow-hidden ${className ?? ''}`}
    >
      <div className="absolute inset-0 paper-grid opacity-[0.08]" aria-hidden />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-display font-semibold">
            {first.attemptInProgress ? 'Exam in progress · continue' : 'Live assessment · attend now'}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">{first.title}</h2>
          <p className="text-paper/70 text-sm mt-2">
            {liveAssessments.length === 1
              ? `${first.subject} · ${first.questionCount} questions${
                  first.durationMinutes > 0 ? ` · ${first.durationMinutes} min` : ''
                }${
                  first.attemptInProgress
                    ? ' — your answers are saved. Continue from where you left.'
                    : ' — your tutor has started this exam.'
                }`
              : `${liveAssessments.length} assessments are live. Start with "${first.title}".`}
          </p>
        </div>
        <ExamStartButton
          assessmentId={first.id}
          className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 shrink-0"
        >
          {first.attemptInProgress ? (
            <>
              <RotateCcw className="w-4 h-4" />
              Resume exam
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start now
            </>
          )}
        </ExamStartButton>
      </div>
    </div>
  )
}
