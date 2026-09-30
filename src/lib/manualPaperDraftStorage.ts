import type { QuestionBankEntry } from '@/types'

export type ManualPaperDraftQuestion = Omit<QuestionBankEntry, 'id' | 'status'> & {
  clientId: string
}

/** Legacy key prefix — cleared on load/logout so old local drafts never repopulate forms. */
const LEGACY_STORAGE_PREFIX = 'prism_manual_paper_draft'

/** Remove any leftover local paper caches (forms must not persist across app close). */
export function purgeLegacyManualPaperDrafts(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(LEGACY_STORAGE_PREFIX)) keys.push(key)
    }
    for (const key of keys) localStorage.removeItem(key)
  } catch {
    /* ignore quota / private mode */
  }
}
