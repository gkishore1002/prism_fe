/** Time-of-day greeting for student home */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const subjectColors: Record<string, string> = {
  math: '#3575c4',
  science: '#10b981',
  english: '#e8b820',
  social: '#8b5cf6',
}

export function subjectColor(id: string): string {
  return subjectColors[id] ?? '#3575c4'
}
