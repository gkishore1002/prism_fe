/** Defaults match institution policy fallbacks in prism_be. */
export const DEFAULT_CSC_INACTIVITY_DAYS = 90
export const DEFAULT_CSC_WARNING_DAYS = 14

export function isCscUrgent(
  daysUntil: number | null | undefined,
  warningThresholdDays = DEFAULT_CSC_WARNING_DAYS,
): boolean {
  return daysUntil != null && daysUntil <= warningThresholdDays
}

export function formatCscInactivityLabel(inactivityDays: number): string {
  return `${inactivityDays} days without a CSC visit`
}
