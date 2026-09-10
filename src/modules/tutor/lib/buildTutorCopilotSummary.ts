import type { TutorCopilotAnalytics } from '@/lib/api/analyticsApi'
import type { BatchTopicWeakness, StudentSummary, TutorBatch } from '@/types'
import { formatSubjects } from '@/lib/formatSubjects'
import { defaultTutorDashboardHeadline, type TutorDashboardHeroSummary } from './dashboardContent'

function normalizeTopic(topic: string) {
  return topic.trim().toLowerCase()
}

export function dedupeHeroTopics(
  strongTopics: string[],
  weakTopics: string[],
): { strongTopics: string[]; weakTopics: string[] } {
  const weakSet = new Set(weakTopics.map(normalizeTopic))
  const strong = strongTopics.filter((topic) => topic.trim() && !weakSet.has(normalizeTopic(topic)))
  const strongSet = new Set(strong.map(normalizeTopic))
  const weak = weakTopics.filter((topic) => !strongSet.has(normalizeTopic(topic)))

  if (weak.length === 1 && strong.length === 0) {
    return { strongTopics: [], weakTopics: weak }
  }

  return { strongTopics: strong.slice(0, 2), weakTopics: weak.slice(0, 3) }
}

function partitionTopics(
  topicWeakness: BatchTopicWeakness[],
  copilotStrong: string[] = [],
): { strong: string[]; weak: string[] } {
  const weak = topicWeakness.map((t) => t.topic).slice(0, 3)
  const { strongTopics, weakTopics } = dedupeHeroTopics(copilotStrong, weak)
  return { strong: strongTopics, weak: weakTopics }
}

function buildHeadline(
  activeBatch: TutorBatch | undefined,
  topWeakness: BatchTopicWeakness | undefined,
  weakTopics: string[],
  copilot: TutorCopilotAnalytics | null,
): string {
  if (copilot?.headline?.trim()) return copilot.headline

  if (topWeakness && weakTopics.length > 0) {
    return `Focus next: ${topWeakness.topic}`
  }

  if (activeBatch?.name) {
    return `${activeBatch.name} · Class overview`
  }

  return defaultTutorDashboardHeadline
}

export function buildTutorCopilotSummary(
  activeBatch: TutorBatch | undefined,
  students: StudentSummary[],
  copilot: TutorCopilotAnalytics | null,
  topicWeakness: BatchTopicWeakness[],
): TutorDashboardHeroSummary {
  const batchStudents = activeBatch
    ? students.filter((s) => activeBatch.studentIds.includes(s.id))
    : students

  const topWeakness = topicWeakness[0]
  const { strong, weak } = partitionTopics(topicWeakness, copilot?.strongTopics ?? [])

  return {
    headline: buildHeadline(activeBatch, topWeakness, weak, copilot),
    subject: formatSubjects(activeBatch?.subjects, activeBatch?.subject, '') ||
      copilot?.subject ||
      'Mathematics',
    batchName: activeBatch?.name ?? copilot?.batchName ?? 'Batch',
    studentCount: batchStudents.length || copilot?.studentCount || 0,
    avgScore: activeBatch?.avgScore ?? copilot?.avgScore ?? 0,
    strongTopics: strong,
    weakTopics: weak.length > 0 ? weak : (copilot?.weakTopics ?? []),
    expectedImprovement: topWeakness?.expectedGain ?? copilot?.expectedImprovement ?? 0,
  }
}
