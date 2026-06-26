import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Users,
  Database,
  Network,
  ClipboardList,
  Calendar,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { Avatar } from '@/components/ui/Avatar'
import { tutorCopilot, batchTopicWeakness, questionBank } from '@/data/mock'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useStudyPlans } from '@/hooks/useStudyPlans'
import { cn } from '@/lib/cn'

export function TutorDashboardPage() {
  const { batches: tutorBatches, students: tutorStudents } = useCurriculum()
  const { studyPlans } = useStudyPlans()
  const activeBatch = tutorBatches[0]
  const recentStudents = tutorStudents.slice(0, 5)
  const activePlans = studyPlans.filter((p) => p.status === 'active')

  return (
    <>
      <PageHeader
        eyebrow={`${tutorCopilot.board} · ${tutorCopilot.grade}`}
        title="Tutor Copilot"
        sub="Your command center — batch health, study plans, and what to teach next."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/tutor/study-plans"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> Study plan
            </Link>
            <Link
              to="/tutor/assessments"
              className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
            >
              <ClipboardList className="w-4 h-4" /> Assessment
            </Link>
          </div>
        }
      />

      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-ink via-[#1a4578] to-[#0f2847] text-paper p-6 sm:p-8 shadow-lg">
        <div className="absolute inset-0 paper-grid opacity-[0.1]" aria-hidden />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-accent text-[10px] uppercase tracking-[0.25em] font-display font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              AI Tutor Summary
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              {tutorCopilot.nextClass}
            </h2>
            <p className="text-paper/75 mt-3 text-sm max-w-xl">
              {tutorCopilot.subject} · {tutorCopilot.batchName} · {tutorCopilot.studentCount}{' '}
              students · Class avg{' '}
              <span className="font-mono-data text-accent font-bold">{tutorCopilot.avgScore}%</span>
            </p>
            <div className="flex flex-wrap gap-4 mt-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-paper/50">Strong</p>
                <p className="text-sm font-semibold text-leaf mt-0.5">
                  {tutorCopilot.strongTopics.join(' · ')}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-paper/50">Needs focus</p>
                <p className="text-sm font-semibold text-accent mt-0.5">
                  {tutorCopilot.weakTopics.join(' · ')}
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="rounded-xl bg-paper/10 backdrop-blur border border-paper/15 p-5">
              <p className="text-[10px] uppercase tracking-widest text-accent font-bold">
                Expected improvement
              </p>
              <p className="font-mono-data text-4xl font-bold mt-2 text-leaf">
                +{tutorCopilot.expectedImprovement}%
              </p>
              <Link
                to="/tutor/assessments"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-accent hover:underline"
              >
                Schedule follow-up test <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <AppStat label="Students" value={tutorStudents.length} hint={activeBatch?.name} />
        <AppStat
          label="Class avg"
          value={activeBatch?.avgScore ?? tutorCopilot.avgScore}
          unit="%"
          tone="accent"
        />
        <AppStat label="Batches" value={tutorBatches.length} />
        <AppStat label="Study plans" value={activePlans.length} hint="Active" tone="leaf" />
        <AppStat label="Weak topics" value={batchTopicWeakness.length} tone="rose" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Study plans */}
        <AppCard className="xl:col-span-1 bg-gradient-to-b from-accent/5 to-transparent border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <h3 className="font-display text-lg font-bold">Study plans</h3>
            </div>
            <Link to="/tutor/study-plans" className="text-xs font-medium text-accent hover:underline">
              Manage
            </Link>
          </div>
          {activePlans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No active plans. Create one for a batch.</p>
          ) : (
            <div className="space-y-3">
              {activePlans.slice(0, 3).map((plan) => {
                const done = plan.days.filter((d) => d.done).length
                const pct = Math.round((done / plan.days.length) * 100)
                return (
                  <Link
                    key={plan.id}
                    to="/tutor/study-plans"
                    className="block p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors"
                  >
                    <p className="text-sm font-semibold text-foreground">{plan.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.batchName} · {plan.studentIds.length} students
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          <Link
            to="/tutor/study-plans"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink hover:text-accent"
          >
            <Plus className="w-3.5 h-3.5" /> New study plan
          </Link>
        </AppCard>

        {/* Topic mastery */}
        <AppCard className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ink" />
              <h3 className="font-display text-lg font-bold">Topic mastery</h3>
            </div>
            <Link to="/tutor/curriculum" className="text-xs text-accent hover:underline">
              Curriculum
            </Link>
          </div>
          <div className="space-y-2">
            {batchTopicWeakness.map((topic) => (
              <div
                key={topic.topic}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/60"
              >
                <span className="font-mono-data text-xs font-bold text-muted-foreground w-5">
                  {topic.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{topic.topic}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{topic.suggestedNextClass}</p>
                </div>
                <span
                  className={`font-mono-data text-sm font-bold shrink-0 ${
                    topic.avgMastery < 60 ? 'text-rose' : 'text-accent'
                  }`}
                >
                  {topic.avgMastery}%
                </span>
              </div>
            ))}
          </div>
        </AppCard>

        {/* Students */}
        <AppCard className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-ink" />
              <h3 className="font-display text-lg font-bold">Students</h3>
            </div>
            <Link to="/tutor/students" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-1">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors"
              >
                <Avatar name={student.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.batch} · {student.readiness}% ready
                  </p>
                </div>
                <HealthBadge status={student.status} score={student.health} />
              </div>
            ))}
          </div>
        </AppCard>
      </div>

      {/* Batches table */}
      <AppCard className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">My batches</h3>
          <Link to="/tutor/curriculum#batches" className="text-xs text-accent hover:underline">
            Manage batches
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b-2 border-ink/10">
                <th className="pb-3 font-semibold">Batch</th>
                <th className="pb-3 font-semibold">Board / Grade</th>
                <th className="pb-3 font-semibold">Subject</th>
                <th className="pb-3 font-semibold">Students</th>
                <th className="pb-3 font-semibold">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tutorBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-accent/5">
                  <td className="py-3 font-semibold text-foreground">{batch.name}</td>
                  <td className="py-3 text-muted-foreground">
                    {batch.board} · {batch.grade}
                  </td>
                  <td className="py-3 text-muted-foreground">{batch.subject ?? '—'}</td>
                  <td className="py-3 font-mono-data font-semibold">{batch.studentIds.length}</td>
                  <td className="py-3 font-mono-data font-bold text-accent">{batch.avgScore ?? 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            to: '/tutor/study-plans',
            icon: Calendar,
            title: 'Study plans',
            desc: 'Day-by-day student plans',
            color: 'border-accent bg-accent/5',
            iconColor: 'text-accent',
          },
          {
            to: '/tutor/assessments',
            icon: ClipboardList,
            title: 'Assessments',
            desc: 'Create & schedule tests',
            color: 'border-ink/20 bg-ink/5',
            iconColor: 'text-ink',
          },
          {
            to: '/tutor/curriculum',
            icon: Network,
            title: 'Curriculum',
            desc: 'Boards, topics & batches',
            color: 'border-blue-200 bg-blue-50/50',
            iconColor: 'text-blue-800',
          },
          {
            to: '/tutor/question-bank',
            icon: Database,
            title: 'Question bank',
            desc: `${questionBank.length} questions`,
            color: 'border-leaf/30 bg-leaf/5',
            iconColor: 'text-leaf',
          },
        ].map((item) => (
          <AppCard key={item.to} className={cn('border-2', item.color)}>
            <Link to={item.to} className="block">
              <item.icon className={cn('w-6 h-6', item.iconColor)} />
              <div className="font-display text-lg font-bold mt-3">{item.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              <span className="text-xs font-semibold text-accent inline-flex items-center gap-1 mt-3">
                Open <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </AppCard>
        ))}
      </div>
    </>
  )
}
