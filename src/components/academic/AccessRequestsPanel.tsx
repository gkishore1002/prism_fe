import { useEffect, useState } from 'react'
import { Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw, User, FileSearch, Download } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { btnClass } from '@/components/ui/Button'
import { StudentProfileModal } from '@/components/academic/StudentProfileModal'
import { ReassignmentReviewModal } from '@/components/academic/ReassignmentReviewModal'
import { fetchAccessRequests } from '@/lib/api/assessmentsApi'
import {
  AccessRequestLegend,
  AccessRequestStatusBadge,
  accessRequestTheme,
  accessRequestToneStyles,
  formatAccessRequestDate,
  toneForAccessRequestStatus,
} from '@/lib/accessRequestTheme'
import type { AssessmentAccessRequest } from '@/types'
import { exportReassignmentCsv } from '@/lib/api/exportsApi'

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all'

function tabClass(active: boolean) {
  return active ? accessRequestTheme.tabActive : accessRequestTheme.tab
}

function RequestCard({
  req,
  onReview,
  onViewProfile,
}: {
  req: AssessmentAccessRequest
  onReview: (req: AssessmentAccessRequest) => void
  onViewProfile: (req: AssessmentAccessRequest) => void
}) {
  const tone = toneForAccessRequestStatus(req.status)
  const styles = accessRequestToneStyles[tone]
  const Icon =
    req.status === 'approved' ? CheckCircle2 : req.status === 'rejected' ? XCircle : Clock

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${styles.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${styles.icon}`}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <AccessRequestStatusBadge status={req.status} emphasis={req.status === 'pending'} />
            </div>
            <p className="font-medium text-foreground">{req.studentName}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{req.assessmentTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Requested {formatAccessRequestDate(req.requestedAt)}
            </p>
            {req.status === 'approved' && req.accessGrantedUntil && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Access until {formatAccessRequestDate(req.accessGrantedUntil)}
              </p>
            )}
            {req.reviewedAt && req.status !== 'pending' && (
              <p className="text-xs text-muted-foreground mt-1">
                Reviewed {formatAccessRequestDate(req.reviewedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onViewProfile(req)}
            className={`${btnClass.secondary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5`}
          >
            <User className="w-3.5 h-3.5" />
            View profile
          </button>
          {req.status === 'pending' ? (
            <button
              type="button"
              onClick={() => onReview(req)}
              className={`${btnClass.primary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5 ${accessRequestTheme.approveBtn}`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              Review
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReview(req)}
              className={`${btnClass.secondary} text-xs px-3 py-1.5 inline-flex items-center gap-1.5`}
            >
              View details
            </button>
          )}
        </div>
      </div>

      {req.reason && (
        <p className={`text-sm text-muted-foreground border-t pt-2 ${styles.border}`}>
          <span className="font-medium text-foreground/80">Reason: </span>
          {req.reason}
        </p>
      )}
    </div>
  )
}

export function AccessRequestsPanel({ scope = 'tutor' }: { scope?: 'tutor' | 'admin' }) {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<AssessmentAccessRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<FilterTab>('pending')
  const [profileTarget, setProfileTarget] = useState<AssessmentAccessRequest | null>(null)
  const [reviewTarget, setReviewTarget] = useState<AssessmentAccessRequest | null>(null)
  const [exporting, setExporting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [pending, approved, rejected] = await Promise.all([
        fetchAccessRequests('pending'),
        fetchAccessRequests('approved'),
        fetchAccessRequests('rejected'),
      ])
      setRequests([...pending, ...approved, ...rejected])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const filtered = tab === 'all' ? requests : requests.filter((r) => r.status === tab)
  const sectionStyles = accessRequestToneStyles.neutral

  async function handleExport() {
    setExporting(true)
    try {
      await exportReassignmentCsv()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading reassignment requests…" />
  }

  return (
    <>
      <AppCard className={`border-2 ${sectionStyles.section}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${sectionStyles.icon}`}>
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-display text-lg text-foreground">Reassignment requests</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review with student performance, deadline context, and prior requests.
              </p>
              <div className="mt-2">
                <AccessRequestLegend />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className={`${btnClass.secondary} text-sm px-3 py-1.5 inline-flex items-center gap-1.5 shrink-0`}
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className={`${btnClass.secondary} text-sm px-3 py-1.5 inline-flex items-center gap-1.5 shrink-0`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              ['pending', `Pending (${pendingCount})`],
              ['approved', 'Approved'],
              ['rejected', 'Rejected'],
              ['all', 'All'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${tabClass(tab === key)}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 space-y-2">
            <p className="text-sm text-rose">{error}</p>
            <button type="button" onClick={() => void load()} className={`${btnClass.secondary} text-xs px-3 py-1.5`}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/50 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === 'pending' ? 'No pending reassignment requests.' : `No ${tab} requests.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onReview={setReviewTarget}
                onViewProfile={setProfileTarget}
              />
            ))}
          </div>
        )}
      </AppCard>

      <ReassignmentReviewModal
        open={reviewTarget != null}
        request={reviewTarget}
        scope={scope}
        onClose={() => setReviewTarget(null)}
        onReviewed={() => {
          void load()
          setReviewTarget(null)
        }}
      />

      <StudentProfileModal
        open={profileTarget != null}
        studentId={profileTarget?.studentId ?? null}
        studentName={profileTarget?.studentName}
        scope={scope}
        focusRequest={profileTarget}
        onClose={() => setProfileTarget(null)}
        onReviewed={() => {
          void load()
          if (profileTarget?.status === 'pending') {
            setProfileTarget(null)
          }
        }}
      />
    </>
  )
}
