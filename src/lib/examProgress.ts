export interface ExamProgressSnapshot {
  assessmentId: string
  answers: Record<string, string>
  flaggedIds: string[]
  currentIndex: number
  remainingSeconds: number | null
  savedAt: number
}

function storageKey(assessmentId: string, studentId: string) {
  return `prism-exam-progress:${assessmentId}:${studentId || 'anon'}`
}

export function loadExamProgress(
  assessmentId: string,
  studentId: string,
): ExamProgressSnapshot | null {
  if (!assessmentId) return null
  try {
    const raw = sessionStorage.getItem(storageKey(assessmentId, studentId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ExamProgressSnapshot
    if (!parsed || parsed.assessmentId !== assessmentId) return null
    return parsed
  } catch {
    return null
  }
}

export function saveExamProgress(studentId: string, snapshot: ExamProgressSnapshot) {
  try {
    sessionStorage.setItem(storageKey(snapshot.assessmentId, studentId), JSON.stringify(snapshot))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearExamProgress(assessmentId: string, studentId: string) {
  try {
    sessionStorage.removeItem(storageKey(assessmentId, studentId))
  } catch {
    /* ignore */
  }
}
