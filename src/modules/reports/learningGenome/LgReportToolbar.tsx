import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Printer, Share2 } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import {
  downloadReportPdf,
  printReport,
  scrollToReportSection,
  shareReportPdf,
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
  /** Hide Print / Download PDF / Share actions (e.g. Class Insights). */
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
  exportLabel = 'Download PDF',
  showExport = true,
  bilingual = false,
  className,
}: LgReportToolbarProps) {
  const [pdfBusy, setPdfBusy] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareHint, setShareHint] = useState<string | null>(null)
  const { language } = useReportLanguage()
  const { L } = useReportLabels()
  const resolvedBackLabel = backLabel === 'Back' ? L.back : backLabel
  const resolvedExportLabel =
    exportLabel === 'Export PDF' || exportLabel === 'Download PDF' ? L.exportPdf : exportLabel
  const fileTitle = printTitle ?? `${brand} ${L.learningGenomeReport}`
  const exportTitle = bilingual ? `${fileTitle} (${reportLanguageLabel(language)})` : fileTitle
  const busy = pdfBusy || shareBusy

  const handlePrint = () => {
    printReport({ title: exportTitle, language: bilingual ? language : undefined })
  }

  const handlePdf = async () => {
    if (busy) return
    setPdfBusy(true)
    setShareHint(null)
    try {
      await downloadReportPdf({
        title: exportTitle,
        language: bilingual ? language : undefined,
      })
    } finally {
      setPdfBusy(false)
    }
  }

  const handleShare = async () => {
    if (busy) return
    const root = document.getElementById('lg-report-print-root')
    if (!root) {
      window.alert(L.reportLoadingAlert)
      return
    }
    setShareBusy(true)
    setShareHint(null)
    try {
      const result = await shareReportPdf({
        title: exportTitle,
        language: bilingual ? language : undefined,
      })
      if (result === 'downloaded') {
        setShareHint(L.shareDownloadedFallback)
      }
    } finally {
      setShareBusy(false)
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
          <button type="button" className="lg-nav-btn" onClick={handlePrint} disabled={busy}>
            <Printer className="h-3.5 w-3.5" aria-hidden />
            {L.print}
          </button>
          <button
            type="button"
            className="lg-nav-btn lg-nav-btn-primary lg-nav-export"
            onClick={() => void handlePdf()}
            disabled={busy}
            aria-busy={pdfBusy}
          >
            {pdfBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden />
            )}
            {pdfBusy ? L.buildingPdf : resolvedExportLabel}
          </button>
          <button
            type="button"
            className="lg-nav-btn"
            onClick={() => void handleShare()}
            disabled={busy}
            aria-busy={shareBusy}
            title={L.share}
          >
            {shareBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Share2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {shareBusy ? L.sharingPdf : L.share}
          </button>
          {shareHint && (
            <span className="text-[10px] text-muted-foreground max-w-[12rem] leading-snug sm:max-w-none">
              {shareHint}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/** Standalone Export PDF control for page headers / filter bars. */
export function LgExportPdfButton({
  title,
  label = 'Download PDF',
  className,
}: {
  title?: string
  label?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const { L } = useReportLabels()
  const resolvedLabel = label === 'Export PDF' || label === 'Download PDF' ? L.exportPdf : label

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
          window.alert(L.reportLoadingAlert)
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
      {busy ? L.buildingPdf : resolvedLabel}
    </button>
  )
}

/** Standalone Share PDF control for page headers / filter bars. */
export function LgSharePdfButton({
  title,
  label = 'Share',
  className,
}: {
  title?: string
  label?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const { L } = useReportLabels()

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 rounded-[10px] border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-opacity hover:bg-secondary disabled:opacity-70',
        className,
      )}
      disabled={busy}
      aria-busy={busy}
      onClick={() => {
        if (busy) return
        const root = document.getElementById('lg-report-print-root')
        if (!root) {
          window.alert(L.reportLoadingAlert)
          return
        }
        setBusy(true)
        void shareReportPdf({ title: title ?? `${APP_NAME} Learning Genome Report` }).finally(() =>
          setBusy(false),
        )
      }}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      {busy ? L.sharingPdf : label === 'Share' ? L.share : label}
    </button>
  )
}
