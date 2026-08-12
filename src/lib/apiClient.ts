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

  if (!headers.has('Content-Type') && rest.body) {
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

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as {
        detail?: string | { msg?: string; loc?: unknown[] }[] | { message?: string }
      }
      if (typeof body.detail === 'string') {
        message = body.detail
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
        message = String(body.detail.message)
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
