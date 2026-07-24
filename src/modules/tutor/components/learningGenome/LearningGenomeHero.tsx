import { BarChart3, CalendarDays, Dna, Users } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { AppStat } from '@/components/layout/AppShell'
import type { LearningGenomeDataset } from '@/modules/tutor/lib/learningGenomeTypes'

interface LearningGenomeHeroProps {
  meta: LearningGenomeDataset['meta']
  totalMarks: number
  subjectsCount: number
  variant?: 'class-insights' | 'full'
}

function formatMarks(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

export function LearningGenomeHero({
  meta,
  totalMarks,
  subjectsCount,
  variant = 'full',
}: LearningGenomeHeroProps) {
  const isClassInsights = variant === 'class-insights'
  const windowLabel = meta.window_label ?? 'Current term'
  const subjectsLabel = meta.subjects_label ?? 'All curriculum subjects'

  return (
    <>
      <section className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-ink via-[#1a4578] to-[#0f2847] text-paper p-6 sm:p-8">
        <div className="absolute inset-0 paper-grid opacity-[0.1]" aria-hidden />
        <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <div className="mb-3 inline-flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              <Dna className="h-4 w-4" />
              {isClassInsights ? 'Class insights' : 'Learning Genome'}
            </div>

            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              {isClassInsights
                ? 'Cohort performance overview'
                : 'Every mark tells a deeper story'}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper/75">
              {isClassInsights
                ? `Built from in-app assessment results and marks saved on the Marks page — ${meta.total_students} students with scores in this batch.`
                : `A comprehensive class view through ${APP_NAME}'s Learning Genome Engine — from assessments and saved marks.`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 bg-paper/10 px-3 py-1 text-xs text-paper/85">
                <CalendarDays className="h-3.5 w-3.5 text-accent" />
                {windowLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 bg-paper/10 px-3 py-1 text-xs text-paper/85">
                <Users className="h-3.5 w-3.5 text-accent" />
                {meta.total_students} students
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/15 bg-paper/10 px-3 py-1 text-xs text-paper/85">
                <BarChart3 className="h-3.5 w-3.5 text-accent" />
                {subjectsLabel}
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center">
            <div className="rounded-xl border border-paper/15 bg-paper/10 p-5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                Class average
              </p>
              <p className="mt-1 font-mono-data text-4xl font-bold text-paper">
                {meta.class_avg}
                <span className="ml-1 text-xl text-accent">%</span>
              </p>
              <p className="mt-2 text-xs text-paper/60">
                Across {subjectsCount} subject{subjectsCount === 1 ? '' : 's'} ·{' '}
                {formatMarks(totalMarks)} total marks scored
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 border-b border-border bg-secondary/25 p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
        <AppStat label="Average score" value={meta.class_avg} unit="%" tone="accent" />
        <AppStat
          label="Total marks"
          value={formatMarks(totalMarks)}
          hint="Cumulative scored"
        />
        <AppStat
          label="Subjects analyzed"
          value={subjectsCount}
          hint={subjectsLabel}
        />
        <AppStat
          label="Students"
          value={meta.total_students}
          hint={windowLabel}
          tone="leaf"
        />
      </div>
    </>
  )
}