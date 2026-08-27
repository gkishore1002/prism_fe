import { type ReactNode } from 'react'
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Maximize2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { btnClass } from '@/components/ui/Button'

export type QuestionGridStatus = 'current' | 'answered' | 'unanswered' | 'skipped'

interface AssessmentExamLayoutProps {
  board: string
  grade: string
  title: string
  currentIndex: number
  totalQuestions: number
  attemptedCount: number
  timeLabel?: string
  timeWarning?: boolean
  saveLabel?: string
  flagged: Set<number>
  getQuestionStatus: (idx: number) => QuestionGridStatus
  hasAnswer?: (idx: number) => boolean
  onJumpTo: (idx: number) => void
  onPrevious: () => void
  onNext: () => void
  canPrevious: boolean
  canNext: boolean
  nextLabel?: string
  children: ReactNode
  paletteOpen: boolean
  onPaletteOpenChange: (open: boolean) => void
  onRequestExit?: () => void
  lockExit?: boolean
  secureGate?: {
    title: string
    message: string
    resumeLabel: string
    onResume: () => void
  } | null
}

function QuestionPalette({
  total,
  flagged,
  getQuestionStatus,
  onJumpTo,
  tone = 'light',
  className,
}: {
  total: number
  flagged: Set<number>
  getQuestionStatus: (idx: number) => QuestionGridStatus
  onJumpTo: (idx: number) => void
  tone?: 'light' | 'dark'
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <div className={cn('grid grid-cols-5 gap-2', className)}>
      {Array.from({ length: total }, (_, idx) => {
        const status = getQuestionStatus(idx)
        const isFlagged = flagged.has(idx)
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onJumpTo(idx)}
            className={cn(
              'relative aspect-square rounded-full text-xs font-mono font-bold transition-colors border',
              dark && status === 'current' && 'bg-accent text-ink border-accent ring-2 ring-accent/35 ring-offset-2 ring-offset-[#0F172A]',
              dark && status === 'answered' && 'bg-white/15 text-white border-white/30',
              dark && status === 'skipped' && 'bg-transparent text-white/80 border-dashed border-white/40',
              dark && status === 'unanswered' && 'bg-white/[0.04] text-white/45 border-white/20 hover:border-white/40 hover:text-white/85',
              !dark && status === 'current' && 'bg-accent text-ink border-accent ring-2 ring-accent/40 ring-offset-2 ring-offset-card',
              !dark && status === 'answered' && 'bg-ink/10 text-ink border-ink/25',
              !dark && status === 'skipped' && 'bg-card text-ink border-dashed border-ink/35',
              !dark && status === 'unanswered' && 'bg-secondary text-muted-foreground border-border hover:border-ink/30 hover:text-ink',
            )}
          >
            {idx + 1}
            {isFlagged && (
              <span
                className={cn(
                  'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose',
                  dark ? 'ring-2 ring-[#0F172A]' : 'border border-card',
                )}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function AssessmentExamLayout({
  board,
  grade,
  title,
  currentIndex,
  totalQuestions,
  attemptedCount,
  timeLabel,
  timeWarning = false,
  saveLabel,
  flagged,
  getQuestionStatus,
  onJumpTo,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  nextLabel = 'Next Question',
  children,
  paletteOpen,
  onPaletteOpenChange,
  onRequestExit,
  lockExit = false,
  secureGate = null,
}: AssessmentExamLayoutProps) {
  const progressPct = totalQuestions ? Math.round((attemptedCount / totalQuestions) * 100) : 0

  function renderSidebar(tone: 'light' | 'dark') {
    const dark = tone === 'dark'
    return (
      <div className={cn('flex flex-col h-full min-h-0', dark ? 'text-white' : 'text-foreground')}>
        <div
          className={cn(
            'shrink-0 rounded-xl px-3 py-2.5 border',
            dark ? 'bg-white/[0.06] border-white/15' : 'bg-secondary/60 border-border',
          )}
        >
          <p className={cn('text-[10px] uppercase tracking-widest font-semibold', dark ? 'text-white/45' : 'text-muted-foreground')}>
            Paper
          </p>
          <p className={cn('text-sm font-semibold mt-0.5 truncate', dark ? 'text-white' : 'text-ink')}>
            {board} · {grade}
          </p>
        </div>

        <div className="mt-5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-baseline justify-between mb-3 shrink-0">
            <p className={cn('text-[10px] uppercase tracking-widest font-bold', dark ? 'text-white/45' : 'text-muted-foreground')}>
              Questions
            </p>
            <p className={cn('text-[11px] font-mono font-semibold', dark ? 'text-white/70' : 'text-ink')}>
              {currentIndex + 1} / {totalQuestions}
            </p>
          </div>
          <div
            className={cn(
              'flex-1 min-h-0 overflow-y-auto scrollbar-thin rounded-xl p-2.5 border',
              dark ? 'border-white/15 bg-white/[0.04]' : 'border-border bg-secondary/40',
            )}
          >
            <QuestionPalette
              tone={tone}
              total={totalQuestions}
              flagged={flagged}
              getQuestionStatus={getQuestionStatus}
              onJumpTo={(idx) => {
                onJumpTo(idx)
                onPaletteOpenChange(false)
              }}
            />
          </div>
        </div>

        <div
          className={cn(
            'mt-4 shrink-0 space-y-3 rounded-xl p-3 border',
            dark ? 'border-white/15 bg-white/[0.04]' : 'border-border bg-secondary/40',
          )}
        >
          <div>
            <div className={cn('flex justify-between text-[11px] mb-1.5 font-medium', dark ? 'text-white/55' : 'text-muted-foreground')}>
              <span>Attempted</span>
              <span className={cn('font-mono font-bold', dark ? 'text-white' : 'text-ink')}>
                {attemptedCount}/{totalQuestions}
              </span>
            </div>
            <div className={cn('h-1.5 rounded-full overflow-hidden', dark ? 'bg-white/10' : 'bg-secondary')}>
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <ul className={cn('space-y-1.5 text-[11px]', dark ? 'text-white/60' : 'text-muted-foreground')}>
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" /> Current
            </li>
            <li className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', dark ? 'bg-white/30' : 'bg-ink/25')} /> Answered
            </li>
            <li className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full border shrink-0', dark ? 'border-white/35' : 'border-ink/40')} /> Skipped
            </li>
            <li className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full border shrink-0', dark ? 'border-white/15 bg-white/5' : 'border-border bg-secondary')} /> Not visited
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose shrink-0" /> Marked for review
            </li>
          </ul>
          {saveLabel && (
            <p className={cn('text-[10px]', dark ? 'text-white/40' : 'text-muted-foreground')}>{saveLabel}</p>
          )}
        </div>
      </div>
    )
  }

  const sidebar = renderSidebar('dark')
  const mobileSidebar = renderSidebar('light')

  return (
    <div className="min-h-dvh h-dvh flex flex-col app-page-bg text-foreground overflow-hidden">
      <header className="lg:hidden shrink-0 flex items-center gap-3 px-4 py-3 glass-nav safe-top">
        <button
          type="button"
          onClick={() => onPaletteOpenChange(!paletteOpen)}
          className="shrink-0 btn btn-action px-3 py-1.5 text-xs font-bold"
        >
          Q{currentIndex + 1}/{totalQuestions}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink truncate">{title}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {board} · {grade}
          </p>
        </div>
        {timeLabel && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-mono font-bold shrink-0 rounded-xl border px-2 py-1',
              timeWarning ? 'text-rose border-rose/30 bg-rose/5' : 'text-ink border-border bg-secondary/60',
            )}
          >
            <Clock className={cn('w-4 h-4', timeWarning ? 'text-rose' : 'text-accent')} />
            {timeLabel}
          </div>
        )}
        {lockExit ? (
          <button
            type="button"
            onClick={onRequestExit}
            className="p-2 rounded-[12px] border border-border bg-card hover:bg-secondary/70 text-muted-foreground ios-press transition-colors"
            aria-label="Leave exam"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Link
            to="/student/assessments"
            className="p-2 rounded-[12px] border border-border bg-card hover:bg-secondary/70 text-muted-foreground ios-press transition-colors"
            aria-label="Exit assessment"
          >
            <X className="w-4 h-4" />
          </Link>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-[240px] xl:w-[260px] shrink-0 flex-col glass-sidebar border-r border-white/15 p-4">
          {sidebar}
        </aside>

        {paletteOpen && (
          <div className="lg:hidden fixed inset-0 z-ln-drawer flex">
            <button
              type="button"
              className="absolute inset-0 glass-overlay"
              onClick={() => onPaletteOpenChange(false)}
              aria-label="Close question palette"
            />
            <aside className="relative w-[min(100%,300px)] h-full glass-sheet p-4 flex flex-col animate-ios-sheet">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <p className="font-bold text-sm text-ink">Question palette</p>
                <button
                  type="button"
                  onClick={() => onPaletteOpenChange(false)}
                  className="p-2 rounded-[12px] hover:bg-secondary/70 text-muted-foreground ios-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {mobileSidebar}
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="hidden lg:flex items-center justify-between px-6 xl:px-10 py-4 glass-nav shrink-0">
            <div className="min-w-0">
              <p className="text-base font-bold text-ink truncate">{title}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {board} · {grade}
              </p>
            </div>
            {timeLabel && (
              <div
                className={cn(
                  'flex items-center gap-2 text-lg font-mono font-bold shrink-0 rounded-xl border px-3 py-1.5',
                  timeWarning
                    ? 'text-rose border-rose/30 bg-rose/5'
                    : 'text-ink border-border bg-secondary/50',
                )}
              >
                <Clock className={cn('w-5 h-5', timeWarning ? 'text-rose' : 'text-accent')} />
                {timeLabel}
              </div>
            )}
            {lockExit ? (
              <button
                type="button"
                onClick={onRequestExit}
                className="ml-4 shrink-0 text-xs font-semibold text-muted-foreground hover:text-ink rounded-xl border border-border bg-card px-3 py-1.5 hover:bg-secondary/60"
              >
                Leave exam
              </button>
            ) : (
              <Link
                to="/student/assessments"
                className="ml-4 shrink-0 text-xs font-semibold text-muted-foreground hover:text-ink rounded-xl border border-border bg-card px-3 py-1.5 hover:bg-secondary/60"
              >
                Exit exam
              </Link>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-5 sm:py-8 scrollbar-thin">
            <div className="w-full max-w-3xl mx-auto text-left">{children}</div>
          </div>

          <footer className="shrink-0 glass-nav border-t border-border px-4 sm:px-6 lg:px-10 xl:px-14 py-4 safe-bottom">
            <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onPrevious}
                disabled={!canPrevious}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors rounded-xl border border-border bg-card px-3 py-2 hover:bg-secondary/60"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <p className="hidden md:block text-xs text-muted-foreground text-center font-medium">
                {lockExit
                  ? 'Answers are saved automatically. Choosing an option moves to the next question.'
                  : (
                    <>
                      Press{' '}
                      <kbd className="px-2 py-1 rounded-[8px] border border-border/60 bg-secondary/80 font-mono text-[10px] font-bold text-ink">
                        ENTER
                      </kbd>{' '}
                      for next
                    </>
                  )}
              </p>

              <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                className={`${btnClass.primary} gap-2 px-5 sm:px-8 py-3 text-sm font-bold disabled:opacity-40`}
              >
                {nextLabel}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </div>
      </div>

      {secureGate && (
        <div
          className="fixed inset-0 z-[45] flex items-center justify-center px-4 bg-[#0F172A]/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-secure-gate-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-card p-6 sm:p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent">
              <Maximize2 className="h-6 w-6" />
            </div>
            <h2 id="exam-secure-gate-title" className="font-display text-xl font-bold text-ink">
              {secureGate.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{secureGate.message}</p>
            <button
              type="button"
              onClick={secureGate.onResume}
              className={`${btnClass.primary} mt-6 w-full justify-center gap-2 px-4 py-3 text-sm font-bold`}
            >
              <Maximize2 className="h-4 w-4" />
              {secureGate.resumeLabel}
            </button>
            {lockExit && onRequestExit && (
              <button
                type="button"
                onClick={onRequestExit}
                className="mt-3 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-ink"
              >
                Leave exam
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface QuestionCardProps {
  questionNumber: number
  totalQuestions: number
  isFlagged: boolean
  onToggleFlag: () => void
  children: ReactNode
}

export function ExamQuestionCard({
  questionNumber,
  totalQuestions,
  isFlagged,
  onToggleFlag,
  children,
}: QuestionCardProps) {
  return (
    <div className="w-full text-left glass-card border border-border rounded-[14px] overflow-hidden ios-shadow-md">
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border bg-secondary/25 backdrop-blur-sm">
        <span className="inline-flex items-center rounded-[12px] bg-accent/90 text-ink text-xs font-bold px-3 py-1.5 uppercase tracking-wide">
          Question {questionNumber} of {totalQuestions}
        </span>
        <button
          type="button"
          onClick={onToggleFlag}
          className={cn(
            'btn shrink-0 gap-1.5 text-xs sm:text-sm px-3 py-1.5 font-semibold',
            isFlagged
              ? 'bg-rose/15 text-rose border border-rose/30 shadow-card'
              : 'btn-secondary border border-border',
          )}
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Flag for Review</span>
          <span className="sm:hidden">Flag</span>
        </button>
      </div>
      <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 text-left">{children}</div>
    </div>
  )
}