export const DEFAULT_PAGE_LIMIT = 10

export const PAGE_LIMIT_OPTIONS = [10, 20, 50] as const

export type PageLimitOption = (typeof PAGE_LIMIT_OPTIONS)[number]

export function pageCount(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, limit)) || 1)
}

export function paginateItems<T>(items: T[], page: number, limit: number): T[] {
  const start = (Math.max(1, page) - 1) * Math.max(1, limit)
  return items.slice(start, start + Math.max(1, limit))
}
