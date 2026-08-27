/** Normalize grade labels: "Grade 8" and "8" both → "8" */
export function normalizeGrade(grade: string): string {
  const match = grade.match(/\d+/)
  return match ? match[0] : grade.trim()
}

export function boardsMatch(a: string, b: string): boolean {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
}

export function gradesMatch(a: string, b: string): boolean {
  return normalizeGrade(a) === normalizeGrade(b)
}

export function subjectsMatch(a: string, b: string): boolean {
  const left = (a ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  const right = (b ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!left || !right) return false
  if (left === right) return true
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left]
  return shorter.length >= 4 && longer.includes(shorter)
}

export interface CurriculumSubjectScope {
  board: string
  grade: string
}

/** Subjects configured under Curriculum setup for a batch's board + grade. */
export function getCurriculumSubjectsForBatch(
  curriculum: { board: string; grades: { grade: string; subjects: { name: string }[] }[] }[],
  batch: CurriculumSubjectScope | undefined,
): string[] {
  if (!batch) return []
  const boardNode = curriculum.find((c) => boardsMatch(c.board, batch.board))
  const gradeNode = boardNode?.grades.find((g) => gradesMatch(g.grade, batch.grade))
  return gradeNode?.subjects.map((s) => s.name) ?? []
}

/** Map a free-text label (e.g. CSV header) to a curriculum subject name. */
export function mapSubjectLabelToCurriculum(label: string, subjects: string[]): string {
  const trimmed = label.trim()
  if (!trimmed || subjects.length === 0) return ''
  const lower = trimmed.toLowerCase()
  const exact = subjects.find((s) => s.toLowerCase() === lower)
  if (exact) return exact
  const partial = subjects.find(
    (s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()),
  )
  return partial ?? ''
}

/** True when student matches board+grade, or has no board/grade set yet (can be assigned). */
export function studentFitsScope(
  student: { board?: string | null; grade?: string | null },
  board: string,
  grade: string,
): boolean {
  const sb = (student.board ?? '').trim()
  const sg = (student.grade ?? '').trim()
  const boardOk = !sb || boardsMatch(sb, board)
  const gradeOk = !sg || gradesMatch(sg, grade)
  return boardOk && gradeOk
}

export interface AcademicScope {
  board: string
  grade: string
}

/** Assessment must match the student's board and grade (BRD hierarchy). */
export function assessmentMatchesScope(
  assessment: AcademicScope,
  student: AcademicScope,
): boolean {
  return boardsMatch(assessment.board, student.board) && gradesMatch(assessment.grade, student.grade)
}

export function scopeLabel(scope: AcademicScope): string {
  const gradeNum = normalizeGrade(scope.grade)
  return `${scope.board} · Grade ${gradeNum}`
}

/** Local calendar date as YYYY-MM-DD */
export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Students can start only after the tutor sets the assessment to live.
 * Scheduled (even on today's date) stays locked until go-live.
 */
export function isAssessmentAvailableNow(assessment: {
  status: string
  scheduledAt?: string | null
}): boolean {
  return assessment.status === 'live'
}
