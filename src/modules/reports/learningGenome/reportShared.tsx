import { useReportLabels } from '@/lib/useReportLabels'
import { formatVsClass } from '@/lib/reportFormatters'

export function ReportVsClass({
  studentPct,
  classAvg,
}: {
  studentPct: number
  classAvg?: number | null
}) {
  const { language } = useReportLabels()
  if (classAvg == null) return <span className="lg-vs-flat">—</span>
  const delta = Math.round((studentPct - classAvg) * 10) / 10
  const text = formatVsClass(delta === 0 ? 0 : delta, language)
  if (delta > 0) return <span className="lg-vs-up">{text}</span>
  if (delta < 0) return <span className="lg-vs-down">{text}</span>
  return <span className="lg-vs-up">{text}</span>
}

export function ReportScoreBar({ pct, gold }: { pct: number; gold?: boolean }) {
  const barColor = (p: number) => (p >= 75 ? '#3E6B9C' : p >= 60 ? '#B7862E' : '#A8402F')
  return (
    <div className="lg-score-bar">
      <span
        style={{
          width: `${Math.min(100, pct)}%`,
          background: gold
            ? 'linear-gradient(90deg, var(--lg-gold), var(--lg-gold-bright))'
            : barColor(pct),
        }}
      />
    </div>
  )
}

export function pctGrade(pct: number): string {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'E'
}

export function barColor(pct: number): string {
  if (pct >= 75) return '#3E6B9C'
  if (pct >= 60) return '#B7862E'
  return '#A8402F'
}
