import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { HealthBadge } from '@/components/ui/HealthBadge'
import type { HealthStatus } from '@/types'
import type { StudentProfileAnalytics } from '@/lib/api/analyticsApi'
import {
  formatStudentGrade,
  studentProfileEyebrow,
} from '@/modules/student/lib/studentProfile'
import { getGreeting } from '@/modules/student/lib/utils'

interface StudentProfileHeaderProps {
  profile: StudentProfileAnalytics
  institutionName?: string
  showGreeting?: boolean
  actions?: React.ReactNode
}

export function StudentProfileHeader({
  profile,
  institutionName,
  showGreeting = true,
  actions,
}: StudentProfileHeaderProps) {
  const firstName = profile.name.split(' ')[0]

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-display font-semibold">
          {studentProfileEyebrow(profile, institutionName)}
        </p>
        {showGreeting ? (
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
            {getGreeting()}, {firstName}.
          </h1>
        ) : (
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
            {profile.name}
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <HealthBadge status={profile.status as HealthStatus} score={profile.healthScore} size="sm" />
          <span className="text-xs text-muted-foreground">
            {formatStudentGrade(profile.grade)} · {profile.board}
          </span>
          {profile.batch && profile.batch !== '—' && (
            <span className="text-xs text-muted-foreground">· {profile.batch}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {actions}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-sm">
          <Flame className="w-4 h-4 text-accent" />
          <span className="font-mono-data font-semibold text-foreground">{profile.streak}</span>
          <span className="text-muted-foreground text-xs">day streak</span>
        </div>
      </div>
    </div>
  )
}

interface StudentProfileCardProps {
  profile: StudentProfileAnalytics
  institutionName?: string
  linkTo?: string
}

export function StudentProfileCard({ profile, institutionName, linkTo }: StudentProfileCardProps) {
  const content = (
    <div className="p-4 rounded-xl border border-border bg-card/80">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Student profile</p>
      <p className="font-display text-lg font-bold mt-1">{profile.name}</p>
      <p className="text-sm text-muted-foreground mt-0.5">
        {studentProfileEyebrow(profile, institutionName)}
      </p>
      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Health</p>
          <p className="font-mono-data text-xl font-bold">{profile.healthScore}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Readiness</p>
          <p className="font-mono-data text-xl font-bold">{profile.readiness}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Improvement</p>
          <p className="font-mono-data text-xl font-bold text-leaf">+{profile.improvement}%</p>
        </div>
      </div>
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo} className="block hover:opacity-90 transition-opacity">{content}</Link>
  }
  return content
}