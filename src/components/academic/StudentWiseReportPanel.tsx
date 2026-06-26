import { Sparkles, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { AppCard, AppStat } from '@/components/layout/AppShell'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { getStudentWiseReport, studentMasterProfiles } from '@/data/mock'
import { cn } from '@/lib/cn'

interface StudentWiseReportPanelProps {
  studentId: string
  className?: string
}

export function StudentWiseReportPanel({ studentId, className }: StudentWiseReportPanelProps) {
  const profile = studentMasterProfiles.find((s) => s.id === studentId)
  const report = getStudentWiseReport(studentId)

  if (!profile || !report) {
    return (
      <AppCard className={className}>
        <p className="text-sm text-muted-foreground">No report data available for this student.</p>
      </AppCard>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <AppCard>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-accent">Student report</div>
            <div className="font-display text-2xl mt-1">{profile.name}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.board} · Grade {profile.grade} · {profile.batch} · {profile.academicYear}
            </p>
            {profile.schoolName && (
              <p className="text-xs text-muted-foreground mt-0.5">{profile.schoolName}</p>
            )}
          </div>
          <HealthBadge status={report.status} score={report.health} />
        </div>
      </AppCard>

      <div className="grid md:grid-cols-4 gap-4">
        <AppStat label="Academic health" value={report.health} unit="/100" tone="accent" />
        <AppStat label="Readiness" value={report.readiness} unit="%" />
        <AppStat
          label="Improvement"
          value={`${report.improvement > 0 ? '+' : ''}${report.improvement}%`}
          tone={report.improvement >= 0 ? 'leaf' : 'rose'}
        />
        <AppStat label="Avg accuracy" value={report.avgAccuracy} unit="%" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <AppCard>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-leaf mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> Strong topics
          </div>
          {report.strongTopics.length > 0 ? (
            <ul className="text-sm space-y-1">
              {report.strongTopics.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None flagged yet</p>
          )}
        </AppCard>
        <AppCard>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-rose mb-3">
            <TrendingDown className="w-3.5 h-3.5" /> Weak topics
          </div>
          {report.weakTopics.length > 0 ? (
            <ul className="text-sm space-y-1">
              {report.weakTopics.map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No weak topics — excellent</p>
          )}
        </AppCard>
      </div>

      <AppCard>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          Recent assessments
        </div>
        <div className="space-y-2">
          {report.recentTests.map((test) => (
            <div
              key={`${test.title}-${test.date}`}
              className="flex items-center justify-between p-3 rounded-md bg-secondary/40"
            >
              <div>
                <p className="text-sm font-medium">{test.title}</p>
                <p className="text-xs text-muted-foreground">
                  {test.date} · {test.subject}
                </p>
              </div>
              <span className="font-mono-data text-lg">{test.accuracy}%</span>
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-accent">AI insight</div>
            <p className="text-sm text-muted-foreground mt-2">{report.insight}</p>
          </div>
        </div>
        {report.criticalGaps > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-rose">
            <AlertTriangle className="w-4 h-4" />
            {report.criticalGaps} critical gap{report.criticalGaps !== 1 ? 's' : ''} — consider tutor intervention
          </div>
        )}
      </AppCard>
    </div>
  )
}
