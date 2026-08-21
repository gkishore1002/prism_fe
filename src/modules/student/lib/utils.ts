/** Time-of-day greeting for student home */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const subjectColors: Record<string, string> = {
  math: '#1C2739',
  science: '#0CBF6E',
  english: '#F7B731',
  social: '#8B5CF6',
}

export function subjectColor(id: string): string {
  return subjectColors[id] ?? '#1C2739'
}
