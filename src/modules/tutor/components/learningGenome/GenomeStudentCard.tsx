import { Link } from 'react-router-dom'
import type { GenomeStudentProfile } from '@/modules/tutor/lib/learningGenomeTypes'
import { MiniRadarChart } from './GenomeCharts'
import { cn } from '@/lib/cn'

interface GenomeStudentCardProps {
  rank: number
  name: string
  overall: number
  subjAvg: GenomeStudentProfile['subj_avg']
  riskLevel?: 'Low' | 'Medium' | 'High'
  href?: string
  onClick?: () => void
}

export function GenomeStudentCard({
  rank,
  name,
  overall,
  subjAvg,
  riskLevel = 'Low',
  href,
  onClick,
}: GenomeStudentCardProps) {
  const riskClass =
    riskLevel === 'High'
      ? 'lg-badge-high'
      : riskLevel === 'Medium'
        ? 'lg-badge-medium'
        : 'lg-badge-low'

  const className = cn('lg-genome-card', (href || onClick) && 'cursor-pointer')

  const content = (
    <>
      <div className="rank-tag">#{rank}</div>
      <div className="flex h-[88px] items-center justify-center">
        <MiniRadarChart subjAvg={subjAvg} />
      </div>
      <div className="gname">{name}</div>
      <div className="gscore">{overall}%</div>
      <div className="grisk mt-1.5">
        <span className={cn('lg-badge', riskClass)}>{riskLevel} risk</span>
      </div>
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
