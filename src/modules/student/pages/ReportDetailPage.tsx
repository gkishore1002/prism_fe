import { Navigate, useParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { btnClass } from '@/components/ui/Button'
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
                className={`${btnClass.secondary} gap-1.5 px-4 py-2 text-sm`}
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className={`${btnClass.primary} gap-2 px-4 py-2 text-sm font-semibold`}
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
