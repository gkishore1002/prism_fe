import type { CohortInsightRow, LearningGenomeDataset } from './learningGenomeTypes'
import { rankedStudentNames } from './learningGenomeData'

export function buildCohortInsights(data: LearningGenomeDataset): CohortInsightRow[] {
  const names = rankedStudentNames(data)
  const students = data.students
  const declining = names.filter((n) => students[n].trend === 'Declining')
  const improving = names
    .filter((n) => students[n].trend === 'Improving')
    .sort((a, b) => students[b].velocity - students[a].velocity)
  const shockStudents = names.filter((n) => students[n].exam_shock.length > 0)
  const mostConsistent = names
    .slice()
    .sort((a, b) => students[a].consistency_sd - students[b].consistency_sd)[0]
  const recovered = names.filter((n) => students[n].recovery === 'Excellent')

  const rows: CohortInsightRow[] = []
  if (declining.length) {
    rows.push({
      tag: 'pattern',
      html: `<b>${declining.length} students</b> show a declining trend across the second test cycle and may need targeted revision before the next monthly test.`,
    })
  }
  if (improving.length) {
    rows.push({
      tag: 'up',
      html: `<b>${improving.slice(0, 3).join(', ')}</b> posted the strongest improvement velocity in the cohort — sustained gains of ${students[improving[0]].velocity}% or more between test cycles.`,
    })
  }
  if (recovered.length) {
    rows.push({
      tag: 'up',
      html: `<b>${recovered.length} students</b> recovered strongly after a low score, bouncing back within one assessment — a strong resilience signal.`,
    })
  }
  if (shockStudents.length) {
    rows.push({
      tag: 'watch',
      html: `<b>${shockStudents.slice(0, 4).join(', ')}</b> ${shockStudents.length > 1 ? 'show' : 'shows'} a sudden score drop — worth a quiet check-in for absence, health, or stress factors.`,
    })
  }
  if (mostConsistent) {
    rows.push({
      tag: 'up',
      html: `<b>${mostConsistent}</b> remains the most consistent performer in the class, with the lowest score variance across all assessments.`,
    })
  }
  return rows
}
