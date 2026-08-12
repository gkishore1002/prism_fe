import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import {
  downloadReportPdf,
  printReport,
  scrollToReportSection,
} from '@/modules/reports/learningGenome/printReport'
import { reportLanguageLabel, useReportLanguage } from '@/components/reports/ReportLanguageToggle'
import { useReportLabels } from '@/lib/useReportLabels'
import { cn } from '@/lib/cn'

export interface LgReportNavLink {
  href: string
  label: string
}

interface LgReportToolbarProps {
  brand?: string
  links?: LgReportNavLink[]
  printTitle?: string
  backHref?: string
  backLabel?: string
  /** Primary download button label */
  exportLabel?: string
  /** Hide Print / Export PDF actions (e.g. Class Insights). */
  showExport?: boolean
  /** Append selected report language to export filename. */
  bilingual?: boolean
  className?: string
}

export function LgReportToolbar({
  brand = APP_NAME,
  links = [],
  printTitle,
  backHref,
  backLabel = 'Back',
  exportLabel = 'Export PDF',
  showExport = true,
  bilingual = false,
  className,
}: LgReportToolbarProps) {
  const [pdfBusy, setPdfBusy] = useState(false)
  const { language } = useReportLanguage()
  const { L } = useReportLabels()
  const resolvedBackLabel = backLabel === 'Back' ? L.back : backLabel
  const resolvedExportLabel = exportLabel === 'Export PDF' ? L.exportPdf : exportLabel
  const fileTitle = printTitle ?? `${brand} ${L.learningGenomeReport}`
  const exportTitle = bilingual ? `${fileTitle} (${reportLanguageLabel(language)})` : fileTitle

  const handlePrint = () => {
    printReport({ title: exportTitle, language: bilingual ? language : undefined })
  }

  const handlePdf = async () => {
    if (pdfBusy) return
    setPdfBusy(true)
    try {
      await downloadReportPdf({
        title: exportTitle,
        language: bilingual ? language : undefined,
      })
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div
      className={cn('lg-nav-pill report-toolbar print:hidden', className)}
      role="navigation"
      aria-label="Report sections"
    >
      {backHref ? (
        <Link to={backHref} className="lg-nav-btn lg-nav-back" aria-label={resolvedBackLabel}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {resolvedBackLabel}
        </Link>
      ) : (
        <span className="lg-nav-brand">{brand}</span>
      )}

      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="lg-nav-link"
          onClick={(e) => {
            e.preventDefault()
            scrollToReportSection(link.href)
          }}
        >
          {link.label}
        </a>
      ))}

      {showExport && (
        <div className="lg-nav-actions">
          <button type="button" className="lg-nav-btn" onClick={handlePrint} disabled={pdfBusy}>
            <Printer className="h-3.5 w-3.5" aria-hidden />
            {L.print}
          </button>
          <button
            type="button"
            className="lg-nav-btn lg-nav-btn-primary lg-nav-export"
            onClick={() => void handlePdf()}
            disabled={pdfBusy}
            aria-busy={pdfBusy}
          >
            {pdfBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden />
            )}
            {pdfBusy ? L.buildingPdf : resolvedExportLabel}
          </button>
        </div>
      )}
    </div>
  )
}

/** Standalone Export PDF control for page headers / filter bars. */
export function LgExportPdfButton({
  title,
  label = 'Export PDF',
  className,
}: {
  title?: string
  label?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 rounded-[10px] bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-opacity disabled:opacity-70',
        className,
      )}
      disabled={busy}
      aria-busy={busy}
      onClick={() => {
        if (busy) return
        const root = document.getElementById('lg-report-print-root')
        if (!root) {
          window.alert('The report is still loading. Wait a moment, then try Export PDF again.')
          return
        }
        setBusy(true)
        void downloadReportPdf({ title: title ?? `${APP_NAME} Learning Genome Report` }).finally(
          () => setBusy(false),
        )
      }}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {busy ? 'Building PDF…' : label}
    </button>
  )
}
