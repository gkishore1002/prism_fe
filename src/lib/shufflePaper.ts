/** Per-student paper shuffle — UI only. Backend question/option keys stay unchanged. */

function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const next = mulberry32(hashSeed(seed))
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1))
    const current = copy[i]
    copy[i] = copy[j] as T
    copy[j] = current as T
  }
  return copy
}

export function paperShuffleSeed(assessmentId: string, studentId: string): string {
  return `${assessmentId}::${studentId || 'anon'}`
}

export function shuffleQuestionsForStudent<T extends { id: string }>(
  questions: readonly T[],
  assessmentId: string,
  studentId: string,
): T[] {
  return seededShuffle(questions, `q:${paperShuffleSeed(assessmentId, studentId)}`)
}

type McqSource = {
  id: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
}

export type ShuffledMcqOption = {
  /** Letter shown in the UI (A–D in display order). */
  displayKey: string
  /** Original bank key (A–D) sent back to the API for grading. */
  originalKey: string
  label: string
}

function collectMcqOptions(question: McqSource): { originalKey: string; label: string }[] {
  if (question.optionA && question.optionB) {
    return [
      { originalKey: 'A', label: question.optionA },
      { originalKey: 'B', label: question.optionB },
      ...(question.optionC ? [{ originalKey: 'C', label: question.optionC }] : []),
      ...(question.optionD ? [{ originalKey: 'D', label: question.optionD }] : []),
    ]
  }
  return [
    { originalKey: 'A', label: 'Option A' },
    { originalKey: 'B', label: 'Option B' },
    { originalKey: 'C', label: 'Option C' },
    { originalKey: 'D', label: 'Option D' },
  ]
}

export function mcqOptionsInBankOrder(question: McqSource): ShuffledMcqOption[] {
  return collectMcqOptions(question).map((opt) => ({
    displayKey: opt.originalKey,
    originalKey: opt.originalKey,
    label: opt.label,
  }))
}

export function mcqOptionsForDisplay(
  question: McqSource,
  opts: { shuffle: boolean; assessmentId: string; studentId: string },
): ShuffledMcqOption[] {
  if (!opts.shuffle) return mcqOptionsInBankOrder(question)
  return shuffledMcqOptions(question, opts.assessmentId, opts.studentId)
}

export function shuffledMcqOptions(
  question: McqSource,
  assessmentId: string,
  studentId: string,
): ShuffledMcqOption[] {
  const seed = `o:${paperShuffleSeed(assessmentId, studentId)}:${question.id}`
  return seededShuffle(collectMcqOptions(question), seed).map((opt, index) => ({
    displayKey: String.fromCharCode(65 + index),
    originalKey: opt.originalKey,
    label: opt.label,
  }))
}
