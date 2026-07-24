import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Pencil,
  Check,
  RotateCcw,
  Users,
  BookOpen,
  TrendingUp,
  Target,
  BarChart3,
} from 'lucide-react'
import { useTutorDashboard } from '@/hooks/useTutorDashboard'
import { useCurriculum } from '@/hooks/useCurriculum'
import { AppSelect } from '@/components/ui/AppSelect'
import type { TutorDashboardHeroContent, TutorDashboardHeroSummary } from '../lib/dashboardContent'
import { cn } from '@/lib/cn'

const inputClass =
  'w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground'

function formatLastUpdated(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function TopicChips({
  topics,
  tone,
  emptyLabel,
}: {
  topics: string[]
  tone: 'strong' | 'weak'
  emptyLabel: string
}) {
  if (topics.length === 0) {
    return <p className="text-sm text-paper/55 italic">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((topic) => (
        <span
          key={topic}
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
            tone === 'strong'
              ? 'border-leaf/40 bg-leaf/15 text-emerald-100'
              : 'border-accent/40 bg-accent/15 text-yellow-100',
          )}
        >
          {topic}
        </span>
      ))}
    </div>
  )
}

interface TutorDashboardHeroProps {
  content: TutorDashboardHeroContent
  summary: TutorDashboardHeroSummary
  lastUpdatedAt: string | null
  batchOptions?: { value: string; label: string }[]
  selectedBatchId?: string
  onBatchChange?: (batchId: string) => void
  onContentChange: (patch: Partial<TutorDashboardHeroContent>) => void
  onSummaryChange: (patch: Partial<TutorDashboardHeroSummary>) => void
  onReset: () => void
}

export function TutorDashboardHero({
  content,
  summary,
  lastUpdatedAt,
  batchOptions = [],
  selectedBatchId = '',
  onBatchChange,
  onContentChange,
  onSummaryChange,
  onReset,
}: TutorDashboardHeroProps) {
  const [editing, setEditing] = useState(false)

  return (
    <section className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-[#0c2238] via-[#163a66] to-[#1e4a82] text-paper shadow-lg">
      <div className="absolute inset-0 paper-grid opacity-[0.08]" aria-hidden />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          {editing ? (
            <input
              value={content.eyebrow}
              onChange={(e) => onContentChange({ eyebrow: e.target.value })}
              className={`${inputClass} max-w-xs`}
              aria-label="Eyebrow label"
            />
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/10 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {content.eyebrow}
            </div>
          )}

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/10 px-3 py-1.5 text-xs font-medium text-paper/80 transition-colors hover:bg-paper/15 hover:text-paper"
            aria-expanded={editing}
          >
            {editing ? (
              <>
                <Check className="h-3.5 w-3.5" /> Done
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" /> Customize
              </>
            )}
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7 space-y-5">
            {editing ? (
              <input
                value={summary.headline}
                onChange={(e) => onSummaryChange({ headline: e.target.value })}
                className={`${inputClass} font-display text-lg font-bold`}
                aria-label="Headline"
              />
            ) : (
              <h2 className="font-display text-2xl font-bold leading-tight sm:text-[1.75rem]">
                {summary.headline}
              </h2>
            )}

            {editing ? (
              <div className="grid gap-2 sm:grid-cols-2 max-w-xl">
                <input
                  value={summary.subject}
                  onChange={(e) => onSummaryChange({ subject: e.target.value })}
                  className={inputClass}
                  aria-label="Subject"
                />
                <input
                  value={summary.batchName}
                  onChange={(e) => onSummaryChange({ batchName: e.target.value })}
                  className={inputClass}
                  aria-label="Batch name"
                />
                <input
                  type="number"
                  value={summary.studentCount}
                  onChange={(e) => onSummaryChange({ studentCount: Number(e.target.value) })}
                  className={inputClass}
                  aria-label="Student count"
                />
                <input
                  type="number"
                  value={summary.avgScore}
                  onChange={(e) => onSummaryChange({ avgScore: Number(e.target.value) })}
                  className={inputClass}
                  aria-label="Class average score"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 bg-paper/10 px-3 py-1 text-xs text-paper/90">
                    <BookOpen className="h-3.5 w-3.5 text-accent" />
                    {summary.subject}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 bg-paper/10 px-3 py-1 text-xs text-paper/90">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    {summary.batchName} · {summary.studentCount} students
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 bg-paper/10 px-3 py-1 text-xs text-paper/90">
                    <BarChart3 className="h-3.5 w-3.5 text-accent" />
                    Class avg{' '}
                    <span className="font-mono-data font-bold text-accent">{summary.avgScore}%</span>
                  </span>
                </div>
                {batchOptions.length > 1 && onBatchChange && (
                  <div className="w-full sm:w-64 min-w-0">
                    <AppSelect
                      label="Batch"
                      value={selectedBatchId}
                      onChange={onBatchChange}
                      options={batchOptions}
                      placeholder="Select batch"
                      variant="on-dark"
                      searchable={batchOptions.length > 6}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-paper/10 bg-paper/[0.06] p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-leaf" />
                  {editing ? (
                    <input
                      value={content.strongLabel}
                      onChange={(e) => onContentChange({ strongLabel: e.target.value })}
                      className={`${inputClass} text-xs`}
                      aria-label="Strong topics label"
                    />
                  ) : (
                    <p className="text-[10px] font-display font-semibold uppercase tracking-widest text-paper/55">
                      {content.strongLabel}
                    </p>
                  )}
                </div>
                {editing ? (
                  <input
                    value={summary.strongTopics.join(' · ')}
                    onChange={(e) =>
                      onSummaryChange({
                        strongTopics: e.target.value
                          .split('·')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    className={inputClass}
                    aria-label="Strong topics"
                  />
                ) : (
                  <TopicChips
                    topics={summary.strongTopics}
                    tone="strong"
                    emptyLabel="Run assessments to surface strengths"
                  />
                )}
              </div>

              <div className="rounded-xl border border-paper/10 bg-paper/[0.06] p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  {editing ? (
                    <input
                      value={content.needsFocusLabel}
                      onChange={(e) => onContentChange({ needsFocusLabel: e.target.value })}
                      className={`${inputClass} text-xs`}
                      aria-label="Needs focus label"
                    />
                  ) : (
                    <p className="text-[10px] font-display font-semibold uppercase tracking-widest text-paper/55">
                      {content.needsFocusLabel}
                    </p>
                  )}
                </div>
                {editing ? (
                  <input
                    value={summary.weakTopics.join(' · ')}
                    onChange={(e) =>
                      onSummaryChange({
                        weakTopics: e.target.value
                          .split('·')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    className={inputClass}
                    aria-label="Weak topics"
                  />
                ) : (
                  <TopicChips
                    topics={summary.weakTopics}
                    tone="weak"
                    emptyLabel="No weak topics flagged"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-accent/25 bg-gradient-to-br from-paper/12 to-paper/5 p-5 backdrop-blur-sm">
              {editing ? (
                <input
                  value={content.expectedImprovementLabel}
                  onChange={(e) => onContentChange({ expectedImprovementLabel: e.target.value })}
                  className={`${inputClass} text-xs mb-2`}
                  aria-label="Expected improvement label"
                />
              ) : (
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-accent">
                  {content.expectedImprovementLabel}
                </p>
              )}

              {editing ? (
                <input
                  type="number"
                  value={summary.expectedImprovement}
                  onChange={(e) =>
                    onSummaryChange({ expectedImprovement: Number(e.target.value) })
                  }
                  className={`${inputClass} font-mono-data text-lg font-bold mt-2`}
                  aria-label="Expected improvement percentage"
                />
              ) : (
                <p className="mt-2 font-mono-data text-5xl font-bold leading-none text-leaf">
                  +{summary.expectedImprovement}
                  <span className="text-2xl text-paper/70">%</span>
                </p>
              )}

              <p className="mt-2 text-xs text-paper/60">
                Estimated lift if the priority topic is addressed this week
              </p>

              {editing ? (
                <div className="mt-4 space-y-2">
                  <input
                    value={content.ctaText}
                    onChange={(e) => onContentChange({ ctaText: e.target.value })}
                    className={inputClass}
                    aria-label="Call to action text"
                  />
                  <input
                    value={content.ctaLink}
                    onChange={(e) => onContentChange({ ctaLink: e.target.value })}
                    className={inputClass}
                    aria-label="Call to action link"
                  />
                </div>
              ) : (
                <Link
                  to={content.ctaLink}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:w-auto"
                >
                  {content.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-md border border-paper/20 px-3 py-1.5 text-xs font-medium text-paper/70 hover:bg-paper/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
              >
                <Check className="h-3.5 w-3.5" /> Save & close
              </button>
            </div>
            {lastUpdatedAt && (
              <p className="text-[10px] text-paper/50">
                Last saved {formatLastUpdated(lastUpdatedAt)}
              </p>
            )}
          </div>
        )}

        {!editing && lastUpdatedAt && (
          <p className="mt-5 text-right text-[10px] text-paper/45">
            Customized {formatLastUpdated(lastUpdatedAt)}
          </p>
        )}
      </div>
    </section>
  )
}

export function TutorDashboardHeroConnected() {
  const {
    heroContent,
    heroSummary,
    lastUpdatedAt,
    selectedBatchId,
    setSelectedBatchId,
    updateHeroContent,
    updateHeroSummary,
    resetHero,
  } = useTutorDashboard()
  const { batches } = useCurriculum()

  const batchOptions = batches.map((b) => ({
    value: b.id,
    label: `${b.name} · ${b.board} · ${b.grade}`,
  }))

  return (
    <TutorDashboardHero
      content={heroContent}
      summary={heroSummary}
      lastUpdatedAt={lastUpdatedAt}
      batchOptions={batchOptions}
      selectedBatchId={selectedBatchId}
      onBatchChange={setSelectedBatchId}
      onContentChange={updateHeroContent}
      onSummaryChange={updateHeroSummary}
      onReset={resetHero}
    />
  )
}
