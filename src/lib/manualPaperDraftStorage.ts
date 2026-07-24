import { readSession } from '@/modules/auth/lib/authStorage'
import type { QuestionBankEntry } from '@/types'

export type ManualPaperDraftQuestion = Omit<QuestionBankEntry, 'id' | 'status'> & {
  clientId: string
}

export interface ManualPaperDraft {
  paperName: string
  questions: ManualPaperDraftQuestion[]
  updatedAt: string
}

const STORAGE_PREFIX = 'prism_manual_paper_draft'

function storageKey(): string {
  const session = readSession()
  const userId = session?.userId ?? 'guest'
  return `${STORAGE_PREFIX}_${userId}`
}

export function readManualPaperDraft(): ManualPaperDraft | null {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return null
    return JSON.parse(raw) as ManualPaperDraft
  } catch {
    return null
  }
}

export function persistManualPaperDraft(
  draft: Omit<ManualPaperDraft, 'updatedAt'>,
): string {
  const updatedAt = new Date().toISOString()
  const payload: ManualPaperDraft = { ...draft, updatedAt }
  localStorage.setItem(storageKey(), JSON.stringify(payload))
  return updatedAt
}

export function clearManualPaperDraft(): void {
  localStorage.removeItem(storageKey())
}
