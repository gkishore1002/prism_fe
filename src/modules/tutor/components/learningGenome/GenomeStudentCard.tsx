import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { GenomeStudentProfile } from '@/modules/tutor/lib/learningGenomeTypes'
import { MiniRadarChart } from './GenomeCharts'
import { cn } from '@/lib/cn'

interface GenomeStudentCardProps {
  rank: number
  name: string
  overall: number
  subjAvg: GenomeStudentProfile['subj_avg']
  href?: string
  onClick?: () => void
}

export function GenomeStudentCard({
  rank,
  name,
  overall,
  subjAvg,
  href,
  onClick,
}: GenomeStudentCardProps) {
  const className = cn(
    'group relative flex flex-col items-center rounded-[14px] border border-border bg-card p-4 text-center transition-all duration-200',
    'hover:border-accent/40 hover:shadow-card-raised hover:-translate-y-0.5',
    (href || onClick) && 'cursor-pointer',
  )

  const content = (
    <>
      <span className="absolute left-3 top-3 text-[10px] font-mono-data uppercase tracking-wide text-muted-foreground">
        #{rank}
      </span>
      <div className="mt-1 flex h-[88px] items-center justify-center">
        <MiniRadarChart subjAvg={subjAvg} />
      </div>
      <p className="mt-2 line-clamp-2 font-display text-sm font-semibold text-foreground">{name}</p>
      <p className="mt-0.5 font-mono-data text-xl font-semibold text-ink">{overall}%</p>
      {(href || onClick) && (
        <span className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
          View profile
          <ChevronRight className="h-3 w-3" />
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}