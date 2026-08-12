import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/components/ui/Toast'
import { useLiveStudentAssessments } from '@/modules/student/components/LiveAssessmentPrompt'

export const STUDENT_ASSESSMENT_REMINDER_KEY = 'prism_student_assessment_reminder'

/**
 * On student login, toast only when a live assessment is ready to take.
 * Scheduled/upcoming assessments do not trigger a notification.
 * Shown once per browser session (cleared on logout).
 */
export function StudentPendingAssessmentReminder() {
  const navigate = useNavigate()
  const { role, isAuthenticated } = useAuth()
  const { liveAssessments, loading } = useLiveStudentAssessments()
  const { ensureLoaded } = useAssessments()
  const { load } = useAnalytics()
  const { showToast } = useToast()
  const shownRef = useRef(false)

  useEffect(() => {
    void ensureLoaded()
    void load('studentAssessments')
  }, [ensureLoaded, load])

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') return
    if (loading) return
    if (shownRef.current) return
    if (sessionStorage.getItem(STUDENT_ASSESSMENT_REMINDER_KEY)) {
      shownRef.current = true
      return
    }

    if (liveAssessments.length === 0) return

    try {
      shownRef.current = true
      sessionStorage.setItem(STUDENT_ASSESSMENT_REMINDER_KEY, '1')

      const first = liveAssessments[0]
      showToast({
        title: 'Live assessment — attend now',
        message:
          liveAssessments.length === 1
            ? `"${first.title}" is live. Start it now before the window closes.`
            : `You have ${liveAssessments.length} live assessments. Start "${first.title}" now.`,
        actionLabel: 'Start assessment',
        onAction: () => navigate(`/student/assessments/${first.id}/take`),
        variant: 'urgent',
        durationMs: 14000,
      })
    } catch {
      // Never blank the student portal if reminder fails
    }
  }, [isAuthenticated, role, loading, liveAssessments, showToast, navigate])

  return null
}
