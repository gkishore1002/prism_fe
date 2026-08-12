import { Navigate, useParams } from 'react-router-dom'
import { ReportLoader } from '@/components/ui/PrismLoader'
import { findMonthBySlug, StudentFullReportView } from '../components/StudentFullReportView'
import { useAnalytics, useAnalyticsPage } from '@/hooks/useAnalytics'
import { LgReportToolbar } from '@/modules/reports/learningGenome/LgReportToolbar'
import '@/modules/tutor/styles/learningGenome.css'

export function StudentReportDetailPage() {
  const { period } = useParams<{ period: string }>()
  useAnalyticsPage('studentReportDetail')
  const { loading, monthlyReports } = useAnalytics()
  const entry = period ? findMonthBySlug(period, monthlyReports) : undefined

  if (loading) {
    return <ReportLoader label="Building monthly progress report…" />
  }

  if (!entry) {
    return <Navigate to="/student/reports" replace />
  }

  return (
    <div className="lg-report-shell space-y-3">
      <LgReportToolbar
        printTitle={`Prism Monthly Report — ${entry.period}`}
        backHref="/student/reports"
        backLabel="All reports"
        links={[
          { href: '#executive', label: 'Summary' },
          { href: '#readiness', label: 'Readiness' },
        ]}
      />
      <div id="lg-report-print-root">
        <StudentFullReportView periodLabel={entry.period} />
      </div>
    </div>
  )
}
