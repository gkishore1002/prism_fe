/** Display helper for multi-subject entities (batch / paper / assessment). */
export function normalizeSubjectsList(
  subjects?: string[] | null,
  subject?: string | null,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (raw: string) => {
    const name = raw.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(name)
  }
  for (const s of subjects ?? []) push(s)
  if (subject) {
    if (subject.includes(' · ')) {
      for (const part of subject.split(' · ')) push(part)
    } else {
      push(subject)
    }
  }
  return out
}

export function formatSubjects(
  subjects?: string[] | null,
  subject?: string | null,
  empty = '—',
): string {
  const list = normalizeSubjectsList(subjects, subject)
  return list.length ? list.join(' · ') : empty
}

export function subjectsOverlap(left: string[], right: string[]): boolean {
  if (!left.length || !right.length) return false
  const rightKeys = new Set(right.map((s) => s.trim().toLowerCase()).filter(Boolean))
  return left.some((s) => rightKeys.has(s.trim().toLowerCase()))
}
