import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAssessments } from '@/hooks/useAssessments'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/components/ui/Toast'
import { resolveStudentProfile } from '@/modules/student/lib/studentProfile'

export const STUDENT_ASSESSMENT_REMINDER_KEY = 'prism_student_assessment_reminder'

/**
 * On student login, toast when live or due assessments are waiting.
 * Shown once per browser session (cleared on logout).
 */
export function StudentPendingAssessmentReminder() {
  const navigate = useNavigate()
  const { role, isAuthenticated, user } = useAuth()
  const { loading: assessmentsLoading, getAssessmentsForStudent, ensureLoaded: ensureAssessmentsLoaded } =
    useAssessments()
  const { studentProfile, loading: analyticsLoading, load } = useAnalytics()
  const { showToast } = useToast()
  const shownRef = useRef(false)

  useEffect(() => {
    void ensureAssessmentsLoaded()
    void load('studentAssessments')
  }, [ensureAssessmentsLoaded, load])

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') return
    if (assessmentsLoading || analyticsLoading) return
    if (shownRef.current) return
    if (sessionStorage.getItem(STUDENT_ASSESSMENT_REMINDER_KEY)) {
      shownRef.current = true
      return
    }

    try {
      const profile = resolveStudentProfile(studentProfile, user)
      if (!profile) return
      const studentId = profile.id || user.id
      if (!studentId) return

      const query = {
        studentId,
        board: profile.board || 'CBSE',
        grade: profile.grade || 'Grade 8',
      }
      const pending = getAssessmentsForStudent(query).filter(
        (a) => !a.studentSubmitted && a.status !== 'completed',
      )
      if (!pending.length) return

      const availableNow = pending.filter((a) => a.status === 'live')
      const upcoming = pending.filter((a) => a.status === 'scheduled')

      shownRef.current = true
      sessionStorage.setItem(STUDENT_ASSESSMENT_REMINDER_KEY, '1')

      if (availableNow.length > 0) {
        const first = availableNow[0]
        showToast({
          title: 'Attend your assessment first',
          message:
            availableNow.length === 1
              ? `"${first.title}" is ready now. Start it before continuing.`
              : `You have ${availableNow.length} assessments ready to take. Attend them first.`,
          actionLabel: 'Start assessment',
          onAction: () => navigate(`/student/assessments/${first.id}/take`),
          variant: 'urgent',
          durationMs: 14000,
        })
        return
      }

      if (upcoming.length > 0) {
        const first = upcoming[0]
        showToast({
          title: 'Pending assessments',
          message:
            upcoming.length === 1
              ? `"${first.title}" is scheduled for ${first.scheduledAt || 'a future date'}. It will open when your tutor goes live.`
              : `You have ${upcoming.length} upcoming assessments. They open when your tutor goes live.`,
          actionLabel: 'View assessments',
          onAction: () => navigate('/student/assessments'),
          variant: 'info',
          durationMs: 12000,
        })
      }
    } catch {
      // Never blank the student portal if reminder fails
    }
  }, [
    isAuthenticated,
    role,
    assessmentsLoading,
    analyticsLoading,
    studentProfile,
    user,
    getAssessmentsForStudent,
    showToast,
    navigate,
  ])

  return null
}