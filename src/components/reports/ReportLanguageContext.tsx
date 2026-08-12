import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ReportLanguage } from '@/types'
import { pickReportCopy, R } from '@/lib/reportLabels'
import { cn } from '@/lib/cn'

interface ReportLanguageContextValue {
  language: ReportLanguage
  setLanguage: (language: ReportLanguage) => void
  t: (english: string, tamil: string) => string
}

const ReportLanguageContext = createContext<ReportLanguageContextValue | null>(null)

export function ReportLanguageProvider({
  children,
  defaultLanguage = 'en',
}: {
  children: ReactNode
  defaultLanguage?: ReportLanguage
}) {
  const [language, setLanguageState] = useState<ReportLanguage>(defaultLanguage)

  const setLanguage = useCallback((next: ReportLanguage) => {
    setLanguageState(next)
    requestAnimationFrame(() => {
      const root = document.getElementById('lg-report-print-root')
      if (root) root.dataset.activeLang = next
      const focus = document.getElementById('report-lang-focus')
      if (focus) {
        focus.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }, [])

  useEffect(() => {
    const root = document.getElementById('lg-report-print-root')
    if (root) root.dataset.activeLang = language
  }, [language])

  const t = useCallback(
    (english: string, tamil: string) => pickReportCopy(language, english, tamil),
    [language],
  )

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  )

  return <ReportLanguageContext.Provider value={value}>{children}</ReportLanguageContext.Provider>
}

export function useReportLanguage(): ReportLanguageContextValue {
  const ctx = useContext(ReportLanguageContext)
  if (!ctx) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (english: string) => english,
    }
  }
  return ctx
}

/** Top bar: View in English | View in Tamil */
export function ReportLanguageBar({ className }: { className?: string }) {
  const { language, setLanguage, t } = useReportLanguage()
  const ctx = useContext(ReportLanguageContext)
  if (!ctx) return null

  return (
    <div className={cn('print:hidden border-b border-[var(--lg-line)] bg-[var(--lg-paper)]', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-medium text-[var(--lg-navy)]">{t('Report language', 'அறிக்கை மொழி')}</p>
          <p className="text-[11px] text-[color:var(--lg-text-muted)] mt-0.5">
            {t(R.languageBarHint.en, R.languageBarHint.ta)}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-[var(--lg-line)] p-0.5 bg-white/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={cn(
              'flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors',
              language === 'en'
                ? 'bg-[var(--lg-navy)] text-white shadow-sm'
                : 'text-[color:var(--lg-text-muted)] hover:text-[var(--lg-navy)]',
            )}
            aria-pressed={language === 'en'}
          >
            {t(R.viewInEnglish.en, R.viewInEnglish.ta)}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={cn(
              'flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors',
              language === 'ta'
                ? 'bg-[var(--lg-navy)] text-white shadow-sm'
                : 'text-[color:var(--lg-text-muted)] hover:text-[var(--lg-navy)]',
            )}
            aria-pressed={language === 'ta'}
          >
            {t(R.viewInTamil.en, R.viewInTamil.ta)}
          </button>
        </div>
      </div>
      {language === 'ta' && (
        <div className="px-4 pb-3">
          <div className="rounded-md border border-[var(--lg-gold)]/40 bg-[var(--lg-gold)]/10 px-3 py-2 text-xs text-[var(--lg-navy)]">
            <p className="font-medium">{R.viewingTamil.ta}</p>
            <p className="mt-1 text-[color:var(--lg-text-muted)]">{R.tamilHowGenerated.ta}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface ReportNarrativeProps {
  english: string
  tamil: string
  note?: string
  englishNote?: string
  tamilNote?: string
  className?: string
  id?: string
}

/** Renders summary in the active report language only (for screen + PDF export). */
export function ReportNarrative({
  english,
  tamil,
  note,
  englishNote,
  tamilNote,
  className,
  id,
}: ReportNarrativeProps) {
  const { language } = useReportLanguage()
  const isTa = language === 'ta'
  const tamilText = tamil.trim()
  const text = isTa ? (tamilText || english) : english
  const langNote = isTa ? tamilNote : englishNote

  return (
    <div
      id={id}
      key={language}
      className={cn('lg-narrative report-lang-focus', className)}
      lang={isTa ? 'ta' : 'en'}
      data-report-lang={language}
    >
      {(langNote || note) && (
        <p className="lg-mono text-[10px] mb-2 text-[color:var(--lg-text-muted)]">{langNote ?? note}</p>
      )}
      <p className="leading-relaxed whitespace-pre-wrap text-[15px]">{text}</p>
    </div>
  )
}

export function reportLanguageLabel(language: ReportLanguage): string {
  return language === 'ta' ? 'Tamil' : 'English'
}
