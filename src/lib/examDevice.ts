const DEVICE_KEY = 'prism_exam_device_id'

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Stable per-browser device id for single-device exam lock. */
export function getExamDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing && existing.trim()) return existing.trim()
    const next = randomId()
    localStorage.setItem(DEVICE_KEY, next)
    return next
  } catch {
    return randomId()
  }
}
