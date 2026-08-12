import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppModal } from '@/components/ui/AppModal'
import { PageLoader } from '@/components/ui/PrismLoader'
import { btnClass } from '@/components/ui/Button'
import { StudentProfileView } from '@/components/academic/StudentProfileView'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useCenters } from '@/hooks/useCenters'
import { ReassignmentReviewModal } from '@/components/academic/ReassignmentReviewModal'
import { fetchStudentMaster } from '@/lib/api/studentsApi'
import { fetchStudentTracking } from '@/lib/api/cscApi'
import { centerLabelById } from '@/lib/centerLabel'
import {
  AccessRequestStatusBadge,
  accessRequestTheme,
  formatAccessRequestDate,
} from '@/lib/accessRequestTheme'
import type { AssessmentAccessRequest, StudentMasterProfile, StudentTracking } from '@/types'

interface StudentProfileModalProps {
  open: boolean
  studentId: string | null
  studentName?: string
  scope: 'tutor' | 'admin'
  onClose: () => void
  onReviewed?: () => void
  focusRequest?: AssessmentAccessRequest | null
}

function batchLabels(student: StudentMasterProfile, batches: { id: string; name: string }[]) {
  if (student.batchIds?.length) {
    return student.batchIds
      .map((id) => batches.find((b) => b.id === id)?.name ?? id)
      .join(', ')
  }
  return student.batch || '—'
}

export function StudentProfileModal({
  open,
  studentId,
  studentName,
  scope,
  onClose,
  onReviewed,
  focusRequest,
}: StudentProfileModalProps) {
  const { batches: tutorBatches } = useCurriculum()
  const { centers } = useCenters()
  const [student, setStudent] = useState<StudentMasterProfile | null>(null)
  const [tracking, setTracking] = useState<StudentTracking | null>(null)
  const [loading, setLoading] = useState(false)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [reviewRequest, setReviewRequest] = useState<AssessmentAccessRequest | null>(null)

  const loadProfile = useCallback(async (id: string) => {
    setLoading(true)
    setTrackingError(null)
    try {
      const [profile, trackingData] = await Promise.all([
        fetchStudentMaster(id),
        fetchStudentTracking(id),
      ])
      setStudent(profile)
      setTracking(trackingData)
    } catch (e) {
      setStudent(null)
      setTracking(null)
      setTrackingError(e instanceof Error ? e.message : 'Failed to load student profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !studentId) {
      setStudent(null)
      setTracking(null)
      setTrackingError(null)
      setReviewRequest(null)
      return
    }
    void loadProfile(studentId)
  }, [open, studentId, loadProfile])

  async function refreshAfterReview() {
    if (!studentId) return
    await loadProfile(studentId)
    onReviewed?.()
  }

  const title = student?.name ?? studentName ?? 'Student profile'
  const showFocusBanner =
    focusRequest?.status === 'pending' && focusRequest.studentId === studentId

  return (
    <>
    <AppModal
      open={open}
      onClose={onClose}
      title="Student profile"
      description={title}
      size="xl"
      footer={
        student ? (
          <div className="flex flex-wrap gap-2 justify-end w-full">
            {showFocusBanner && focusRequest && (
              <button
                type="button"
                onClick={() => setReviewRequest(focusRequest)}
                className={`${btnClass.primary} text-sm px-4 py-2 ${accessRequestTheme.approveBtn}`}
              >
                Review reassignment
              </button>
            )}
            <Link
              to={`/${scope}/students/${student.id}/report`}
              className="text-sm px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90"
              onClick={onClose}
            >
              View report
            </Link>
          </div>
        ) : undefined
      }
    >
      {loading && !student ? (
        <PageLoader label="Loading student profile…" />
      ) : student ? (
        <div className="space-y-4">
          {showFocusBanner && (
            <div className={`rounded-xl border p-4 ${accessRequestTheme.cardActive}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <AccessRequestStatusBadge status="pending" emphasis className="mb-2" />
                  <p className="text-sm font-semibold text-foreground">Reassignment under review</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{focusRequest.assessmentTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested {formatAccessRequestDate(focusRequest.requestedAt)}
                  </p>
                  {focusRequest.reason && (
                    <p className="text-xs text-muted-foreground mt-2 border-l-2 border-border pl-2">
                      {focusRequest.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <StudentProfileView
            student={student}
            tracking={tracking}
            trackingLoading={loading}
            trackingError={trackingError}
            batchLabel={batchLabels(student, tutorBatches)}
            centerLabel={centerLabelById(student.centerId, centers)}
            scope={scope}
            onReviewRequest={(req) =>
              setReviewRequest({
                id: req.id,
                assessmentId: req.assessmentId,
                assessmentTitle: req.assessmentTitle,
                studentId: req.studentId,
                studentName: student.name,
                reason: req.reason,
                status: req.status,
                requestedAt: req.requestedAt,
                reviewedBy: req.reviewedBy,
                reviewedAt: req.reviewedAt,
                reviewNotes: req.reviewNotes,
                accessGrantedUntil: req.accessGrantedUntil,
              })
            }
          />
        </div>
      ) : (
        <p className="text-sm text-rose">{trackingError ?? 'Student not found'}</p>
      )}
    </AppModal>

    <ReassignmentReviewModal
      open={reviewRequest != null}
      request={reviewRequest}
      scope={scope}
      onClose={() => setReviewRequest(null)}
      onReviewed={() => {
        setReviewRequest(null)
        void refreshAfterReview()
      }}
    />
  </>
  )
}
