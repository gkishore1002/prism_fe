import { useEffect, useMemo, useState } from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  FileSearch,
  Download,
  Eye,
} from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/PrismLoader'
import { btnClass } from '@/components/ui/Button'
import { AppModal } from '@/components/ui/AppModal'
import { Pagination } from '@/components/ui/Pagination'
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
import { DEFAULT_PAGE_LIMIT, pageCount, paginateItems } from '@/lib/pagination'
import type { AssessmentAccessRequest } from '@/types'
import { exportReassignmentCsv } from '@/lib/api/exportsApi'

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all'

function tabClass(active: boolean) {
  return active ? accessRequestTheme.tabActive : accessRequestTheme.tab
}

function RequestInfoModal({
  open,
  request,
  onClose,
  onReview,
}: {
  open: boolean
  request: AssessmentAccessRequest | null
  onClose: () => void
  onReview?: (req: AssessmentAccessRequest) => void
}) {
  if (!request) return null

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Request details"
      description={`${request.studentName} · ${request.assessmentTitle}`}
      size="md"
      footer={
        <div className="flex flex-wrap gap-2 justify-end w-full">
          <button type="button" onClick={onClose} className={`${btnClass.secondary} text-sm px-4 py-2`}>
            Close
          </button>
          {request.status === 'pending' && onReview && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onReview(request)
              }}
              className={`${btnClass.primary} text-sm px-4 py-2 ${accessRequestTheme.approveBtn}`}
            >
              Review request
            </button>
          )}
        </div>
      }
    >
      <dl className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <AccessRequestStatusBadge status={request.status} emphasis={request.status === 'pending'} />
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">Student</dt>
          <dd className="text-foreground text-right font-medium">{request.studentName}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">Assessment</dt>
          <dd className="text-foreground text-right font-medium">{request.assessmentTitle}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">Requested</dt>
          <dd className="text-foreground text-right">{formatAccessRequestDate(request.requestedAt)}</dd>
        </div>
        {request.reviewedAt && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Reviewed</dt>
            <dd className="text-foreground text-right">{formatAccessRequestDate(request.reviewedAt)}</dd>
          </div>
        )}
        {request.status === 'approved' && request.accessGrantedUntil && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Access until</dt>
            <dd className="text-foreground text-right">
              {formatAccessRequestDate(request.accessGrantedUntil)}
            </dd>
          </div>
        )}
        {request.reviewNotes && (
          <div className="pt-2 border-t border-border">
            <dt className="text-muted-foreground mb-1">Review notes</dt>
            <dd className="text-foreground">{request.reviewNotes}</dd>
          </div>
        )}
        {request.reason && (
          <div className="pt-2 border-t border-border">
            <dt className="text-muted-foreground mb-1">Reason</dt>
            <dd className="text-foreground">{request.reason}</dd>
          </div>
        )}
      </dl>
    </AppModal>
  )
}

function RequestRow({
  req,
  onReview,
  onViewProfile,
  onViewInfo,
}: {
  req: AssessmentAccessRequest
  onReview: (req: AssessmentAccessRequest) => void
  onViewProfile: (req: AssessmentAccessRequest) => void
  onViewInfo: (req: AssessmentAccessRequest) => void
}) {
  const tone = toneForAccessRequestStatus(req.status)
  const styles = accessRequestToneStyles[tone]
  const Icon =
    req.status === 'approved' ? CheckCircle2 : req.status === 'rejected' ? XCircle : Clock

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3.5 py-3 rounded-md border transition-colors ${styles.card} hover:border-accent/30`}
    >
      <div className="min-w-0 flex items-start gap-2.5">
        <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${styles.icon}`}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{req.studentName}</p>
            <AccessRequestStatusBadge status={req.status} emphasis={req.status === 'pending'} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {req.assessmentTitle}
            {' · '}
            Requested {formatAccessRequestDate(req.requestedAt)}
            {req.status === 'approved' && req.accessGrantedUntil
              ? ` · Access until ${formatAccessRequestDate(req.accessGrantedUntil)}`
              : ''}
          </p>
          {req.reason && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              <span className="font-medium text-foreground/70">Reason: </span>
              {req.reason}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pl-2">
        <button
          type="button"
          onClick={() => onViewInfo(req)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          aria-label={`View info for ${req.studentName}`}
          title="View info"
        >
          <Eye className="w-4 h-4" />
        </button>
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
  )
}

export function AccessRequestsPanel({ scope = 'tutor' }: { scope?: 'tutor' | 'admin' }) {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<AssessmentAccessRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<FilterTab>('pending')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT)
  const [profileTarget, setProfileTarget] = useState<AssessmentAccessRequest | null>(null)
  const [reviewTarget, setReviewTarget] = useState<AssessmentAccessRequest | null>(null)
  const [infoTarget, setInfoTarget] = useState<AssessmentAccessRequest | null>(null)
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

  useEffect(() => {
    setPage(1)
  }, [tab])

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const filtered = useMemo(
    () => (tab === 'all' ? requests : requests.filter((r) => r.status === tab)),
    [requests, tab],
  )
  const pages = pageCount(filtered.length, limit)
  const pageRows = useMemo(() => paginateItems(filtered, page, limit), [filtered, page, limit])

  useEffect(() => {
    if (page > pages) setPage(pages)
  }, [page, pages])

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
          <>
            <div className="space-y-2">
              {pageRows.map((req) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  onReview={setReviewTarget}
                  onViewProfile={setProfileTarget}
                  onViewInfo={setInfoTarget}
                />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              total={filtered.length}
              limit={limit}
              itemLabel="requests"
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next)
                setPage(1)
              }}
            />
          </>
        )}
      </AppCard>

      <RequestInfoModal
        open={infoTarget != null}
        request={infoTarget}
        onClose={() => setInfoTarget(null)}
        onReview={setReviewTarget}
      />

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
