import type { GenomeStudentProfile } from './learningGenomeTypes'
import { SUBJECT_FULL } from './learningGenomeData'

export function buildStudentNarrative(
  name: string,
  profile: GenomeStudentProfile,
  totalStudents: number,
): string {
  const strongName = SUBJECT_FULL[profile.strongest]
  const weakName = SUBJECT_FULL[profile.weakest]
  const parts: string[] = []

  parts.push(
    `${name} is currently performing at ${profile.overall}% overall (class rank #${profile.rank} of ${totalStudents}), with a clear strength in ${strongName} and the most room to grow in ${weakName}.`,
  )

  const trendPhrase =
    profile.trend === 'Improving'
      ? `The trend across recent test cycles is positive — scores moved up by roughly ${profile.velocity}%. `
      : profile.trend === 'Declining'
        ? `The trend across recent test cycles shows a slip of roughly ${Math.abs(profile.velocity)}%. `
        : 'Performance has stayed steady across recent test cycles. '

  const consPhrase =
    profile.consistency === 'High'
      ? 'Day-to-day consistency is high — this student performs close to their own average almost every time.'
      : profile.consistency === 'Medium'
        ? 'Consistency is moderate — some days land well above or below the average.'
        : 'Consistency is lower — results vary sharply from one test to the next, which is worth watching.'

  parts.push(trendPhrase + consPhrase)

  if (profile.recovery === 'Excellent') {
    parts.push(
      `After a rough test, ${name.split(' ')[0]} typically bounces back quickly — a strong resilience signal.`,
    )
  } else if (profile.recovery === 'Good') {
    parts.push('Recovery after a weak test is reasonable, though not always complete by the next attempt.')
  } else if (profile.recovery === 'Needs Support') {
    parts.push('Recovery after a weak test tends to be slow — consider a short reteach before the next attempt.')
  }

  parts.push(
    `On the current trajectory, the model projects a next-test score of approximately ${profile.predicted}% in the most recent subject cycle.`,
  )

  if (profile.risk_level === 'High') {
    parts.push(
      'Combined signals place this student in the High Risk band — recommend a focused review with the subject teacher.',
    )
  } else if (profile.risk_level === 'Medium') {
    parts.push('Overall risk sits in the Medium band — worth a light check-in, nothing urgent.')
  } else {
    parts.push('Overall risk is Low — no immediate intervention flagged.')
  }

  return parts.join(' ')
}
