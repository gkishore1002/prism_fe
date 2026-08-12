import { useMemo } from 'react'
import { useReportLanguage } from '@/components/reports/ReportLanguageContext'
import {
  forecastTableHeaders,
  historyTableHeaders,
  label,
  labelsFor,
  subjectBreakdownHeaders,
  type ReportLabelKey,
} from '@/lib/reportLabels'

export function useReportLabels() {
  const { language, setLanguage, t } = useReportLanguage()
  const L = useMemo(() => labelsFor(language), [language])
  const pick = (key: ReportLabelKey) => label(key, language)
  return {
    language,
    setLanguage,
    t,
    L,
    pick,
    subjectHeaders: subjectBreakdownHeaders(language),
    historyHeaders: historyTableHeaders(language),
    forecastHeaders: forecastTableHeaders(language),
  }
}

export { useReportLanguage } from '@/components/reports/ReportLanguageContext'
