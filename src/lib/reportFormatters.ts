import type { ReportLanguage } from '@/types'
import { label, translateHealthStatus, translateSeverity } from '@/lib/reportLabels'

export function formatReportDate(value: string, lang: ReportLanguage = 'en'): string {
  if (!value) return '—'
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  return value.slice(0, 10)
}

export function formatVsClass(delta: number, lang: ReportLanguage): string {
  const sign = delta >= 0 ? '+' : ''
  const suffix = lang === 'ta' ? ' வகுப்பு ஒப்பீட்டில்' : ' vs class'
  return `${sign}${delta.toFixed(1)}%${suffix}`
}

export function formatRankLine(rank: number, total: number, lang: ReportLanguage): string {
  if (lang === 'ta') return `${label('rankOf', lang)}${rank} ${label('of', lang)} ${total}`
  return `${label('rankOf', lang)}${rank} ${label('of', lang)} ${total}`
}

export function formatQuickFactsStatus(status: string, lang: ReportLanguage): string {
  return `${label('status', lang)} ${translateHealthStatus(status, lang)}`
}

export function formatHeroQuickFacts(
  parts: { board?: string; grade?: string; batch?: string; status?: string },
  lang: ReportLanguage,
): string {
  const segs: string[] = []
  if (parts.board) segs.push(parts.board)
  if (parts.grade) segs.push(parts.grade)
  if (parts.batch) segs.push(parts.batch)
  if (parts.status) segs.push(formatQuickFactsStatus(parts.status, lang))
  return segs.join(' · ')
}

export function formatGenomeQuickFacts(
  rank: number,
  total: number,
  attendance: number,
  risk: string,
  lang: ReportLanguage,
): string {
  return lang === 'ta'
    ? `${label('rankOf', lang)}${rank} ${label('of', lang)} ${total} · ${label('attendance', lang)} ${attendance}% · ${label('risk', lang)} ${risk}`
    : `${label('rankOf', lang)}${rank} ${label('of', lang)} ${total} · ${label('attendance', lang)} ${attendance}% · ${label('risk', lang)} ${risk}`
}

export function studentInsightBulletsLocalized(
  health: { overall: number; status: string; trend: number } | null,
  gaps: { topicName: string; severity: string }[],
  readiness: { subjectName: string; currentReadiness: number }[],
  lang: ReportLanguage,
): string[] {
  const bullets: string[] = []
  if (health) {
    bullets.push(
      lang === 'ta'
        ? `கல்வி சுகாதாரம் ${health.overall}% (${translateHealthStatus(health.status, lang)}) · போக்கு ${health.trend > 0 ? '+' : ''}${health.trend}.`
        : `Academic health ${health.overall}% (${health.status}) · trend ${health.trend > 0 ? '+' : ''}${health.trend}.`,
    )
  }
  if (gaps[0]) {
    bullets.push(
      lang === 'ta'
        ? `முக்கிய இடைவெளி: ${gaps[0].topicName} (${translateSeverity(gaps[0].severity, lang)} முன்னுரிமை).`
        : `Top gap: ${gaps[0].topicName} (${gaps[0].severity} priority).`,
    )
  }
  if (readiness[0]) {
    bullets.push(
      lang === 'ta'
        ? `${readiness[0].subjectName} தயார்நிலை ${readiness[0].currentReadiness}%.`
        : `${readiness[0].subjectName} readiness at ${readiness[0].currentReadiness}%.`,
    )
  }
  return bullets.slice(0, 4)
}

export function fallbackAssessmentSummaryTa(report: { assessmentTitle: string; accuracy: number }): string {
  return `${report.assessmentTitle} தேர்வில் ${report.accuracy}% மதிப்பெண்.`
}

export function fallbackOverallSummaryTa(
  studentName: string,
  health: number,
  improving: boolean,
  criticalGaps: number,
): string {
  const trend = improving ? 'முன்னேற்றம் உள்ளது' : 'கவனம் தேவை'
  return `${studentName} அவர்களின் ஒட்டுமொத்த கற்றல் சுகாதாரம் ${health}% ஆக உள்ளது. ${trend}. ${criticalGaps} முக்கிய இடைவெளிகள் கண்டறியப்பட்டுள்ளன.`
}

export function fallbackGenomeNarrativeTa(
  name: string,
  overall: number,
  rank: number,
  totalStudents: number,
): string {
  return `${name} அவர்களின் ஒட்டுமொத்த மதிப்பெண் ${overall}% ஆகும். வகுப்பில் ${rank}/${totalStudents} இடம். விரிவான பகுப்பாய்வுக்கு CSC மையத்தை அணுகவும்.`
}
