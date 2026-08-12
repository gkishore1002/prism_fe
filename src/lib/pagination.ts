export const DEFAULT_PAGE_LIMIT = 10

export const PAGE_LIMIT_OPTIONS = [10, 20, 50] as const

export type PageLimitOption = (typeof PAGE_LIMIT_OPTIONS)[number]
