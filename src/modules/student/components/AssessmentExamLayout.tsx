import { type ReactNode } from 'react'
import {
  Building2,
  GraduationCap,
  Flag,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export type QuestionGridStatus = 'current' | 'answered' | 'unanswered'

interface AssessmentExamLayoutProps {
  board: string
  grade: string
  title: string
  currentIndex: number
  totalQuestions: number
  attemptedCount: number
  timeLabel?: string
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
}

function QuestionPalette({
  total,
  flagged,
  getQuestionStatus,
  onJumpTo,
  className,
}: {
  total: number
  flagged: Set<number>
  getQuestionStatus: (idx: number) => QuestionGridStatus
  onJumpTo: (idx: number) => void
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-5 sm:grid-cols-6 gap-1.5 sm:gap-2', className)}>
      {Array.from({ length: total }, (_, idx) => {
        const status = getQuestionStatus(idx)
        const isFlagged = flagged.has(idx)
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onJumpTo(idx)}
            className={cn(
              'relative aspect-square rounded-md text-xs sm:text-sm font-mono font-bold transition-all',
              status === 'current' &&
                'ring-2 ring-accent ring-offset-2 ring-offset-card bg-accent text-ink scale-105',
              status === 'answered' && 'bg-ink/10 text-ink border border-ink/20',
              status === 'unanswered' &&
                'bg-secondary border border-border text-muted-foreground hover:border-ink/30 hover:text-ink',
            )}
          >
            {idx + 1}
            {isFlagged && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose border border-card" />
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
}: AssessmentExamLayoutProps) {
  const progressPct = totalQuestions ? Math.round((attemptedCount / totalQuestions) * 100) : 0

  const sidebar = (
    <div className="flex flex-col h-full text-foreground">
      <div className="space-y-2 shrink-0">
        <div className="rounded-lg bg-secondary/60 border border-border px-3 py-2.5">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
            <Building2 className="w-3.5 h-3.5 shrink-0 text-ink/70" />
            Board
          </div>
          <p className="text-sm font-bold text-ink">{board}</p>
        </div>
        <div className="rounded-lg bg-secondary/60 border border-border px-3 py-2.5">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-ink/70" />
            Grade
          </div>
          <p className="text-sm font-bold text-ink">{grade}</p>
        </div>
      </div>

      <div className="mt-5 flex-1 min-h-0 flex flex-col">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
          Questions
        </p>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-0.5">
          <QuestionPalette
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

      <div className="mt-4 shrink-0 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
            <span>Attempted</span>
            <span className="font-mono text-ink font-bold">
              {attemptedCount} / {totalQuestions}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground hover:text-ink hover:bg-secondary transition-colors"
        >
          <LifeBuoy className="w-4 h-4" />
          Support
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh h-dvh flex flex-col app-page-bg text-foreground overflow-hidden">
      <header className="lg:hidden shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button
          type="button"
          onClick={() => onPaletteOpenChange(!paletteOpen)}
          className="shrink-0 rounded-md bg-accent text-ink px-3 py-1.5 text-xs font-bold"
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
          <div className="flex items-center gap-1 text-sm font-mono text-ink font-bold shrink-0">
            <Clock className="w-4 h-4 text-accent" />
            {timeLabel}
          </div>
        )}
        <Link
          to="/student/assessments"
          className="p-2 rounded-md hover:bg-secondary text-muted-foreground"
          aria-label="Exit assessment"
        >
          <X className="w-4 h-4" />
        </Link>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-[240px] xl:w-[260px] shrink-0 flex-col border-r border-border bg-card p-4">
          {sidebar}
        </aside>

        {paletteOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <button
              type="button"
              className="absolute inset-0 bg-ink/30"
              onClick={() => onPaletteOpenChange(false)}
              aria-label="Close question palette"
            />
            <aside className="relative w-[min(100%,300px)] h-full bg-card border-r border-border p-4 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <p className="font-bold text-sm text-ink">Question palette</p>
                <button
                  type="button"
                  onClick={() => onPaletteOpenChange(false)}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="hidden lg:flex items-center justify-between px-6 xl:px-10 py-4 border-b border-border bg-card shrink-0">
            <div className="min-w-0">
              <p className="text-base font-bold text-ink truncate">{title}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {board} · {grade}
              </p>
            </div>
            {timeLabel && (
              <div className="flex items-center gap-2 text-lg font-mono text-ink font-bold shrink-0">
                <Clock className="w-5 h-5 text-accent" />
                {timeLabel}
              </div>
            )}
            <Link
              to="/student/assessments"
              className="text-xs font-semibold text-muted-foreground hover:text-ink ml-4 shrink-0"
            >
              Exit exam
            </Link>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-5 sm:py-8 scrollbar-thin">
            <div className="w-full max-w-3xl mx-auto text-left">{children}</div>
          </div>

          <footer className="shrink-0 border-t border-border bg-card px-4 sm:px-6 lg:px-10 xl:px-14 py-4">
            <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onPrevious}
                disabled={!canPrevious}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <p className="hidden md:block text-xs text-muted-foreground text-center font-medium">
                Press{' '}
                <kbd className="px-2 py-1 rounded border border-border bg-secondary font-mono text-[10px] font-bold text-ink">
                  ENTER
                </kbd>{' '}
                for next
              </p>

              <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                className="inline-flex items-center gap-2 bg-ink hover:opacity-90 text-paper px-5 sm:px-8 py-3 rounded-lg text-sm font-bold disabled:opacity-40 transition-colors"
              >
                {nextLabel}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </div>
      </div>
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
    <div className="w-full text-left bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-border bg-secondary/30">
        <span className="inline-flex items-center rounded-md bg-accent/90 text-ink text-xs font-bold px-3 py-1 uppercase tracking-wide">
          Question {questionNumber} of {totalQuestions}
        </span>
        <button
          type="button"
          onClick={onToggleFlag}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0',
            isFlagged
              ? 'bg-rose/15 text-rose border border-rose/30'
              : 'bg-card text-muted-foreground hover:text-ink border border-border hover:bg-secondary',
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
