import type { QuestionBankEntry, QuestionPaper } from '@/types'

export function uniqueTopics(questions: QuestionBankEntry[]): string[] {
  return [...new Set(questions.map((q) => q.topic))].sort()
}

export function questionsForPaper(
  paper: QuestionPaper,
  bank: QuestionBankEntry[],
  selectedTopics?: string[],
): QuestionBankEntry[] {
  const inPaper = bank.filter((q) => paper.questionIds.includes(q.id))
  if (!selectedTopics || selectedTopics.length === 0) return inPaper
  return inPaper.filter((q) => selectedTopics.includes(q.topic))
}

export function totalMarksForQuestions(questions: QuestionBankEntry[]): number {
  return questions.reduce((sum, q) => sum + q.marks, 0)
}

export function topicCounts(paper: QuestionPaper, bank: QuestionBankEntry[]) {
  const counts = new Map<string, number>()
  for (const id of paper.questionIds) {
    const q = bank.find((item) => item.id === id)
    if (q) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1)
  }
  return paper.topics.map((topic) => ({ topic, count: counts.get(topic) ?? 0 }))
}
