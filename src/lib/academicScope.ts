/** Normalize grade labels: "Grade 8" and "8" both → "8" */
export function normalizeGrade(grade: string): string {
  const match = grade.match(/\d+/)
  return match ? match[0] : grade.trim()
}

export function boardsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function gradesMatch(a: string, b: string): boolean {
  return normalizeGrade(a) === normalizeGrade(b)
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
