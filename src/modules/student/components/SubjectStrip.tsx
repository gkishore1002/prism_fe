import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { subjectColor } from '../lib/utils'

interface SubjectItem {
  subjectId: string
  subjectName: string
  health: number
}

interface SubjectStripProps {
  subjects: SubjectItem[]
  className?: string
}

export function SubjectStrip({ subjects, className }: SubjectStripProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1 scrollbar-thin', className)}>
      {subjects.map((s) => (
        <Link
          key={s.subjectId}
          to="/student/reports"
          className="shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-card border border-border hover:border-accent/40 card-hover"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: subjectColor(s.subjectId) }}
          />
          <div>
            <p className="text-[11px] text-muted-foreground font-sans leading-none">{s.subjectName}</p>
            <p className="text-[15px] font-mono-data font-semibold text-foreground mt-0.5">{s.health}%</p>
          </div>
        </Link>
      ))}
    </div>
  )
}