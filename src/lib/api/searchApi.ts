import { apiFetch } from '@/lib/apiClient'

export type SearchResultKind = 'student' | 'topic' | 'question' | 'paper'

export interface SearchResultItem {
  id: string
  kind: SearchResultKind
  title: string
  subtitle?: string | null
  href: string
}

export interface SearchResults {
  query: string
  students: SearchResultItem[]
  topics: SearchResultItem[]
  questions: SearchResultItem[]
  papers: SearchResultItem[]
}

export async function searchPortal(query: string, limit = 12): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit) })
  return apiFetch<SearchResults>(`/search?${params.toString()}`)
}

export function flattenSearchResults(results: SearchResults): SearchResultItem[] {
  return [...results.students, ...results.topics, ...results.questions, ...results.papers]
}
