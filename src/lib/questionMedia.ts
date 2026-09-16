/** Resolve a question image to the authenticated `/question-media/{key}` API path. */

function encodeSegment(part: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(part))
  } catch {
    return encodeURIComponent(part)
  }
}

export function questionMediaPath(
  url?: string | null,
  key?: string | null,
): string | undefined {
  const raw = (url || '').trim()
  const keyPart = (key || '').trim().replace(/^\/+/, '')

  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw

  let path = raw
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      const mediaIdx = parsed.pathname.indexOf('/question-media/')
      if (mediaIdx >= 0) {
        path = parsed.pathname.slice(mediaIdx)
      } else {
        const apiIdx = parsed.pathname.indexOf('/api/v1/')
        path = apiIdx >= 0 ? parsed.pathname.slice(apiIdx + '/api/v1'.length) : parsed.pathname
      }
    } catch {
      path = raw
    }
  }

  if (!path && keyPart) path = `/question-media/${keyPart}`
  if (!path) return undefined

  if (!path.startsWith('/')) path = `/${path}`
  if (path.startsWith('/api/v1/')) path = path.slice('/api/v1'.length)
  if (!path.startsWith('/question-media/')) {
    path = `/question-media${path.startsWith('/') ? path : `/${path}`}`
  }
  return path
}

export function toQuestionMediaFetchPath(
  url?: string | null,
  key?: string | null,
): string | undefined {
  const path = questionMediaPath(url, key)
  if (!path) return undefined
  if (path.startsWith('blob:') || path.startsWith('data:') || /^https?:\/\//i.test(path)) return path
  return path
    .split('/')
    .map((part, index) => (index === 0 ? part : encodeSegment(part)))
    .join('/')
}
