import { readSession } from '@/modules/auth/lib/authStorage'
import { readActiveOrgCode, isPlatformContext } from '@/modules/auth/lib/orgContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function isApiEnabled(): boolean {
  return API_BASE.length > 0
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  if (!isApiEnabled()) {
    throw new ApiError('API base URL not configured', 0)
  }

  const { auth = true, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData

  if (!headers.has('Content-Type') && rest.body && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const session = readSession()
    const token = session?.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (session?.role === 'super_user') {
      const orgCode = readActiveOrgCode()
      if (orgCode && !isPlatformContext()) headers.set('X-Org-Code', orgCode)
    }
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...rest, headers })
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_BASE}. If this site is on Vercel, the backend CORS_ORIGINS must include this origin.`,
      0,
    )
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as {
        detail?: string | { msg?: string; loc?: unknown[] }[] | { message?: string }
        message?: string
        error?: unknown
        error_message?: string
      }
      const raw =
        typeof body.detail === 'string'
          ? body.detail
          : body.detail &&
              typeof body.detail === 'object' &&
              !Array.isArray(body.detail) &&
              typeof (body.detail as { message?: string }).message === 'string'
            ? String((body.detail as { message?: string }).message)
            : typeof body.message === 'string'
              ? body.message
              : typeof body.error_message === 'string'
                ? body.error_message
                : typeof body.error === 'string'
                  ? body.error
                  : null
      if (raw) {
        message = raw
          .replace(/\s*Pass force\s*=\s*true to publish anyway\.?/gi, '')
          .trim()
        const incomplete = message.match(/^(\d+)\s+subject\(s\) are not fully entered yet\.?$/i)
        if (incomplete) {
          const n = Number(incomplete[1])
          message =
            n === 1
              ? '1 subject is not fully entered yet. Enter and save marks for every student in that subject, then publish again.'
              : `${n} subjects are not fully entered yet. Enter and save marks for every student in those subjects, then publish again.`
        }
        if (!message || message === 'true' || message === 'false') {
          message = res.statusText || 'Request failed'
        }
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item) => {
            if (typeof item === 'string') return item
            const loc = Array.isArray(item.loc) ? item.loc.filter((p) => p !== 'body').join(' › ') : ''
            const msg = item.msg ?? 'Invalid value'
            return loc ? `${loc}: ${msg}` : msg
          })
          .join('; ')
      } else if (body.detail && typeof body.detail === 'object' && 'message' in body.detail) {
        const nested = String(body.detail.message || '').trim()
        message = nested && nested !== 'true' ? nested : res.statusText || 'Request failed'
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getApiBaseUrl(): string {
  return API_BASE
}
