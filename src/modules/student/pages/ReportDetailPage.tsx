import { Navigate, useParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { findMonthBySlug, StudentFullReportView } from '../components/StudentFullReportView'

export function StudentReportDetailPage() {
  const { period } = useParams<{ period: string }>()
  const entry = period ? findMonthBySlug(period) : undefined

  if (!entry) {
    return <Navigate to="/student/reports" replace />
  }

  const handlePrint = () => window.print()

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Monthly report"
          title={entry.month}
          sub="Full academic intelligence for this period."
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md border border-border hover:bg-secondary"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          }
        />
      </div>

      <StudentFullReportView periodLabel={entry.month} />
    </>
  )
}
