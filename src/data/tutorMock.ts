import { tutorBatches, batchTopicWeakness } from '@/data/mock'

export const tutorBatchList = tutorBatches.map((b) => ({
  id: b.id,
  name: `${b.board} ${b.grade} · ${b.name}`,
  students: b.studentIds.length,
  avg: b.avgScore ?? 0,
  completion: Math.round((b.avgScore ?? 0) + 2),
}))

export const tutorAtRisk = [
  { name: 'Rohan Das', grade: 8, board: 'CBSE', reason: 'Weak: Geometry, Mensuration · trend ↓', risk: 88 },
  { name: 'Vikram Singh', grade: 8, board: 'CBSE', reason: 'Consistency drop · 2 critical gaps', risk: 81 },
  { name: 'Meera J.', grade: 8, board: 'CBSE', reason: 'Readiness 48% · Linear Equations', risk: 74 },
]

export const tutorBatchHeatmap = batchTopicWeakness.map((t) => ({
  topic: t.topic,
  mastery: t.avgMastery,
}))
