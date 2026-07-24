import type { AtRiskStudent, InstitutionOverview } from '@/lib/api/analyticsApi'
import type { ClassInsight } from '@/types'

export function institutionInsightBullets(
  overview: InstitutionOverview | null,
  hardestTopics: { topic: string; correct: number }[],
  atRisk: AtRiskStudent[],
): string[] {
  const bullets: string[] = []
  if (overview) {
    bullets.push(
      `${overview.totalStudents} students tracked · institution health ${overview.avgHealth}% · readiness ${overview.avgReadiness}%.`,
    )
    if (overview.avgImprovement !== 0) {
      bullets.push(
        `Average improvement trend is ${overview.avgImprovement > 0 ? '+' : ''}${overview.avgImprovement} points across the cohort.`,
      )
    }
  }
  if (hardestTopics[0]) {
    bullets.push(
      `Weakest topic institution-wide: ${hardestTopics[0].topic} (${hardestTopics[0].correct}% mastery).`,
    )
  }
  if (atRisk.length > 0) {
    bullets.push(`${atRisk.length} student(s) flagged for early intervention.`)
  }
  return bullets.slice(0, 4)
}

export function boardInsightBullets(
  boardReport: { board: string; avg: number; atRisk: number; weakSubject: string }[],
): string[] {
  return boardReport.slice(0, 3).map(
    (row) =>
      `${row.board}: ${row.avg}% avg health · ${row.atRisk} at risk · weakest subject ${row.weakSubject}.`,
  )
}

export function centerInsightBullets(
  centers: { name: string; avg: number; students: number; growth: number }[],
): string[] {
  const sorted = [...centers].sort((a, b) => a.avg - b.avg)
  return sorted.slice(0, 3).map(
    (center) =>
      `${center.name}: ${center.students} students · ${center.avg}% health · growth ${center.growth > 0 ? '+' : ''}${center.growth}%.`,
  )
}

export function studentInsightBullets(
  health: { overall: number; status: string; trend: number } | null,
  gaps: { topicName: string; severity: string }[],
  readiness: { subjectName: string; currentReadiness: number }[],
): string[] {
  const bullets: string[] = []
  if (health) {
    bullets.push(
      `Academic health ${health.overall}% (${health.status}) · trend ${health.trend > 0 ? '+' : ''}${health.trend}.`,
    )
  }
  if (gaps[0]) {
    bullets.push(`Top gap: ${gaps[0].topicName} (${gaps[0].severity} priority).`)
  }
  if (readiness[0]) {
    bullets.push(
      `${readiness[0].subjectName} readiness at ${readiness[0].currentReadiness}%.`,
    )
  }
  return bullets.slice(0, 4)
}

export function classInsightBullets(insights: ClassInsight[]): string[] {
  return insights.slice(0, 4).map(
    (insight) =>
      `${insight.title} — ${insight.affectedStudents} affected · ${insight.suggestedIntervention}`,
  )
}

export function subjectReportInsightBullets(
  subject: string,
  students: { name: string; health: number }[],
): string[] {
  if (students.length === 0) {
    return [`No scored data yet for ${subject}. Add marks or run assessments.`]
  }
  const avg = Math.round(
    students.reduce((sum, student) => sum + student.health, 0) / students.length,
  )
  const weak = [...students].sort((a, b) => a.health - b.health).slice(0, 2)
  const strong = [...students].sort((a, b) => b.health - a.health)[0]
  const bullets = [
    `${students.length} students scored in ${subject} · class health average ${avg}%.`,
  ]
  if (strong) {
    bullets.push(`Top performer: ${strong.name} at ${strong.health}%.`)
  }
  if (weak[0]) {
    bullets.push(`Needs support: ${weak[0].name} at ${weak[0].health}%.`)
  }
  return bullets
}

export function subjectTopicInsightBullets(
  topic: string,
  students: { name: string; topics: { name: string; mastery: number }[] }[],
  topicMastery: number,
): string[] {
  const scored = students
    .map((student) => ({
      name: student.name,
      mastery: student.topics.find((row) => row.name === topic)?.mastery,
    }))
    .filter((row): row is { name: string; mastery: number } => row.mastery != null)

  if (scored.length === 0) {
    return [`${topic} has class average ${topicMastery}%, but no per-student topic scores yet.`]
  }

  const avg = Math.round(scored.reduce((sum, row) => sum + row.mastery, 0) / scored.length)
  const weakest = [...scored].sort((a, b) => a.mastery - b.mastery)[0]
  const strongest = [...scored].sort((a, b) => b.mastery - a.mastery)[0]

  return [
    `${topic}: ${scored.length} students scored · class topic average ${avg}%.`,
    strongest ? `Best on this topic: ${strongest.name} (${strongest.mastery}%).` : '',
    weakest ? `Focus here: ${weakest.name} (${weakest.mastery}%).` : '',
  ].filter(Boolean)
}

export function subjectStudentInsightBullets(
  student: {
    name: string
    health: number
    readiness: number
    topics: { name: string; mastery: number }[]
  },
  subject: string,
): string[] {
  if (student.topics.length === 0) {
    return [
      `${student.name} has ${subject} health ${student.health}% and readiness ${student.readiness}%.`,
      'Topic breakdown will appear once marks or assessments cover individual topics.',
    ]
  }

  const sorted = [...student.topics].sort((a, b) => a.mastery - b.mastery)
  const weakest = sorted[0]
  const strongest = sorted[sorted.length - 1]

  return [
    `${student.name}: ${subject} health ${student.health}% · readiness ${student.readiness}%.`,
    strongest ? `Strongest topic: ${strongest.name} (${strongest.mastery}%).` : '',
    weakest ? `Weakest topic: ${weakest.name} (${weakest.mastery}%).` : '',
  ].filter(Boolean)
}
