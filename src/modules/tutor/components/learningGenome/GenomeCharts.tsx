import type { GenomeDailyPoint, GenomeStudentProfile, SubjectCode } from '@/modules/tutor/lib/learningGenomeTypes'
import { SUBJECT_COLORS, SUBJECT_FULL } from '@/modules/tutor/lib/learningGenomeData'

const SUBJECT_ORDER: SubjectCode[] = ['TAM', 'ENG', 'MAT', 'SCI', 'SOC']

export function MiniRadarChart({
  subjAvg,
  size = 88,
}: {
  subjAvg: GenomeStudentProfile['subj_avg']
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.36
  const pts = SUBJECT_ORDER.map((s, i) => {
    const val = (subjAvg[s] ?? 0) / 100
    const ang = -Math.PI / 2 + i * ((2 * Math.PI) / 5)
    return [cx + Math.cos(ang) * R * val, cy + Math.sin(ang) * R * val]
  })
  const ring = SUBJECT_ORDER.map((_, i) => {
    const ang = -Math.PI / 2 + i * ((2 * Math.PI) / 5)
    return [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R]
  })
  const poly = pts.map((p) => p.join(',')).join(' ')
  const ringPoly = ring.map((p) => p.join(',')).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <polygon points={ringPoly} fill="none" stroke="#E4DCC4" strokeWidth={1} />
      <polygon
        points={poly}
        fill="rgba(197,160,89,0.35)"
        stroke="#C5A059"
        strokeWidth={1.5}
      />
    </svg>
  )
}

export function GenomeFingerprintChart({
  subjAvg,
  size = 220,
}: {
  subjAvg: GenomeStudentProfile['subj_avg']
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.32
  const labelR = size * 0.44
  const pts = SUBJECT_ORDER.map((s, i) => {
    const val = (subjAvg[s] ?? 0) / 100
    const ang = -Math.PI / 2 + i * ((2 * Math.PI) / 5)
    return [cx + Math.cos(ang) * R * val, cy + Math.sin(ang) * R * val] as const
  })
  const rings = [0.4, 0.7, 1].map((scale) =>
    SUBJECT_ORDER.map((_, i) => {
      const ang = -Math.PI / 2 + i * ((2 * Math.PI) / 5)
      return [cx + Math.cos(ang) * R * scale, cy + Math.sin(ang) * R * scale] as const
    }),
  )
  const poly = pts.map((p) => p.join(',')).join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Learning genome fingerprint"
    >
      {rings.map((ring, idx) => (
        <polygon
          key={idx}
          points={ring.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="#E4DCC4"
          strokeWidth={1}
        />
      ))}
      {SUBJECT_ORDER.map((_, i) => {
        const ang = -Math.PI / 2 + i * ((2 * Math.PI) / 5)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(ang) * R}
            y2={cy + Math.sin(ang) * R}
            stroke="#E4DCC4"
            strokeWidth={1}
          />
        )
      })}
      <polygon points={poly} fill="rgba(197,160,89,0.35)" stroke="#C5A059" strokeWidth={1.8} />
      {SUBJECT_ORDER.map((s, i) => {
        const ang = -Math.PI / 2 + i * ((2 * Math.PI) / 5)
        return (
          <text
            key={s}
            x={cx + Math.cos(ang) * labelR}
            y={cy + Math.sin(ang) * labelR}
            fontSize={10}
            fontWeight={600}
            fill="#0D1B2A"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {SUBJECT_FULL[s]}
          </text>
        )
      })}
    </svg>
  )
}

export function DailyCurveChart({ curve, height = 180 }: { curve: GenomeDailyPoint[]; height?: number }) {
  const w = 560
  const h = height
  const pad = { l: 30, r: 14, t: 16, b: 26 }
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const n = curve.length
  const x = (i: number) => pad.l + (n <= 1 ? 0 : i * (iw / (n - 1)))
  const y = (v: number) => pad.t + ih - (v / 100) * ih
  const linePts = curve.map((d, i) => `${x(i)},${y(d.score)}`).join(' ')
  const avg = curve.reduce((a, d) => a + d.score, 0) / Math.max(curve.length, 1)
  const avgY = y(avg)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Daily performance curve">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            y1={y(v)}
            x2={w - pad.r}
            y2={y(v)}
            stroke="#E4DCC4"
            strokeWidth={1}
          />
          <text x={4} y={y(v) + 3} fontSize={8.5} fill="#8a8570" fontFamily="IBM Plex Mono, monospace">
            {v}
          </text>
        </g>
      ))}
      <line
        x1={pad.l}
        y1={avgY}
        x2={w - pad.r}
        y2={avgY}
        stroke="#C5A059"
        strokeWidth={1}
        strokeDasharray="3,3"
      />
      <polyline points={linePts} fill="none" stroke="#5B6570" strokeWidth={2} />
      {curve.map((d, i) => (
        <circle
          key={`${d.date}-${d.subject}`}
          cx={x(i)}
          cy={y(d.score)}
          r={4}
          fill={SUBJECT_COLORS[d.subject]}
          stroke="#fff"
          strokeWidth={1.5}
        >
          <title>{`${d.subject} ${d.date}: ${d.score}%`}</title>
        </circle>
      ))}
      {curve.map((d, i) => (
        <text
          key={`lbl-${d.date}`}
          x={x(i)}
          y={h - 6}
          fontSize={8.5}
          fill="#5B5748"
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
        >
          {d.date.split('-')[0]}
        </text>
      ))}
    </svg>
  )
}

export function TrendMark({ trend, velocity }: { trend: string; velocity: number }) {
  if (trend === 'Improving') {
    return <span className="lg-trend-up">▲ +{velocity}%</span>
  }
  if (trend === 'Declining') {
    return <span className="lg-trend-down">▼ {velocity}%</span>
  }
  return (
    <span className="lg-trend-flat">
      ▬ {velocity >= 0 ? '+' : ''}
      {velocity}%
    </span>
  )
}