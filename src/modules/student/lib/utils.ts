/** Time-of-day greeting for student home */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const subjectColors: Record<string, string> = {
  math: '#0065f3',
  science: '#0fa96e',
  english: '#ff950a',
  social: '#7c6cf0',
}

export function subjectColor(id: string): string {
  return subjectColors[id] ?? '#0065f3'
}
