export const PHONE_EMAIL_DOMAIN = 'gmail.com'
export const MIN_PHONE_DIGITS = 10

export function normalizePhone(input: string): string {
  return (input || '').replace(/\D/g, '')
}

export function phoneToLoginEmail(phone: string): string {
  const digits = normalizePhone(phone)
  if (digits.length < MIN_PHONE_DIGITS) return ''
  return `${digits}@${PHONE_EMAIL_DOMAIN}`
}

export function defaultPasswordFromPhone(phone: string): string {
  return normalizePhone(phone)
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone)
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= 15
}

export function resolvePassword(phone: string, password?: string): string {
  const trimmed = password?.trim()
  return trimmed || defaultPasswordFromPhone(phone)
}
