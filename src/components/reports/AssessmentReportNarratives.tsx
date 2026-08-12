import { fallbackAssessmentSummaryTa } from '@/lib/reportBilingual'
import { ReportNarrative } from '@/components/reports/ReportLanguageToggle'
import { useReportLabels } from '@/lib/useReportLabels'
import type { AssessmentReport } from '@/types'

interface AssessmentReportNarrativesProps {
  report: AssessmentReport
  className?: string
}

export function AssessmentReportNarratives({ report, className }: AssessmentReportNarrativesProps) {
  const { L, t } = useReportLabels()
  const sourceNote =
    report.summarySource === 'vertex' ? L.noteAiStored : L.noteEnglishRule.replace('English · ', '')

  return (
    <ReportNarrative
      id="report-lang-focus"
      className={className}
      english={report.summary}
      tamil={report.summaryTa || fallbackAssessmentSummaryTa(report)}
      englishNote={`${t('English', 'ஆங்கிலம்')} · ${sourceNote}`}
      tamilNote={`${t('Tamil', 'தமிழ்')} · ${sourceNote}`}
    />
  )
}
