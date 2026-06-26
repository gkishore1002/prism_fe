import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Sparkles, Calendar, Target, ArrowRight } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { useStudyPlans } from '@/hooks/useStudyPlans'
import { useAuth } from '@/hooks/useAuth'
import { studentProfile } from '@/data/mock'
import { cn } from '@/lib/cn'

const taskTypeStyles: Record<string, string> = {
  Revise: 'bg-blue-100 text-blue-800',
  Practice: 'bg-accent/25 text-ink',
  Assessment: 'bg-ink text-paper',
  Review: 'bg-leaf/20 text-leaf',
}

export function StudentStudyPlanPage() {
  const { user } = useAuth()
  const { getPlansForStudent, toggleDayDone } = useStudyPlans()
  const plans = getPlansForStudent(user.id)
  const plan = plans[0]

  if (!plan) {
    return (
      <>
        <PageHeader
          eyebrow="Study plan"
          title="Your study plan"
          sub="Personalised day-by-day plan from your tutor."
        />
        <AppCard className="text-center py-12">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No active study plan yet</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            When your tutor assigns a plan for your batch, it will appear here with daily tasks.
          </p>
          <Link
            to="/student/assessments"
            className="inline-flex items-center gap-1 text-sm text-accent mt-4 hover:underline"
          >
            Practice via assessments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </AppCard>
      </>
    )
  }

  const doneCount = plan.days.filter((d) => d.done).length
  const todayDay = plan.days.find((d) => !d.done)?.day ?? plan.days.length
  const todayTask = plan.days.find((d) => d.day === todayDay)

  return (
    <>
      <PageHeader
        eyebrow={`${plan.board} · ${plan.grade} · ${plan.subject}`}
        title={plan.title}
        sub="Follow your tutor&apos;s day-by-day plan. Mark tasks complete as you finish."
      />

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <AppCard className="border-l-4 border-l-accent">
          <Target className="w-4 h-4 text-accent mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Target</p>
          <p className="font-mono-data text-2xl font-bold mt-1">
            {plan.baselineScore}% → {plan.targetScore}%
          </p>
        </AppCard>
        <AppCard className="border-l-4 border-l-ink">
          <Calendar className="w-4 h-4 text-ink mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Progress</p>
          <p className="font-mono-data text-2xl font-bold mt-1">
            {doneCount}/{plan.durationDays}
          </p>
          <p className="text-xs text-muted-foreground">days complete</p>
        </AppCard>
        <AppCard className="border-l-4 border-l-leaf md:col-span-2 bg-ink text-paper">
          <Sparkles className="w-4 h-4 text-accent mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-paper/60">Today — Day {todayDay}</p>
          <p className="font-medium mt-1">{todayTask?.focus ?? 'Plan complete!'}</p>
          {todayTask && (
            <p className="text-xs text-paper/70 mt-1">
              {todayTask.type} · {todayTask.mins} min
              {todayTask.topic ? ` · ${todayTask.topic}` : ''}
            </p>
          )}
        </AppCard>
      </div>

      <AppCard>
        <h3 className="font-display text-xl font-bold mb-6">{plan.durationDays}-day plan</h3>
        <div className="space-y-2">
          {plan.days.map((d) => {
            const isToday = d.day === todayDay && !d.done
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDayDone(plan.id, d.id)}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-3 rounded-lg border text-left transition-colors',
                  d.done && 'border-leaf/30 bg-leaf/5',
                  isToday && 'border-accent bg-accent/10 ring-1 ring-accent/30',
                  !d.done && !isToday && 'border-border hover:bg-secondary/30',
                )}
              >
                <span className="font-mono-data text-xs text-muted-foreground w-12 shrink-0">
                  Day {d.day}
                </span>
                {d.done ? (
                  <CheckCircle2 className="w-5 h-5 text-leaf shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', d.done && 'text-muted-foreground line-through')}>
                    {d.focus}
                  </p>
                  {d.topic && <p className="text-xs text-muted-foreground">{d.topic}</p>}
                </div>
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded font-semibold shrink-0',
                    taskTypeStyles[d.type],
                  )}
                >
                  {d.type}
                </span>
                <span className="font-mono-data text-xs text-muted-foreground w-12 text-right shrink-0">
                  {d.mins}m
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Tap a day to mark it complete · {studentProfile.name}
        </p>
      </AppCard>
    </>
  )
}
