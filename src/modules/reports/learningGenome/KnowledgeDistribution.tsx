import { useMemo } from 'react'
import { subjectColorForName } from '@/modules/tutor/lib/learningGenomeData'

export type KnowledgeItem = {
  concept: string
  subject: string
  chapter?: string
  masteryPct: number
  correct?: number
  total?: number
}

export function knowledgeFill(pct: number, subject?: string): string {
  if (subject) return subjectColorForName(subject)
  if (pct >= 75) return '#C5A059'
  if (pct >= 55) return '#E0C36A'
  return '#9B4437'
}

export function knowledgeChipColor(pct: number): string {
  if (pct >= 80) return 'rgba(197,160,89,0.42)'
  if (pct >= 60) return 'rgba(224,195,106,0.32)'
  return 'rgba(155,68,55,0.32)'
}

export type ChapterKnowledgeGroup = {
  subject: string
  chapter: string
  masteryPct: number
  topics: KnowledgeItem[]
}

export function groupKnowledgeByChapter(items: KnowledgeItem[]): ChapterKnowledgeGroup[] {
  const map = new Map<string, ChapterKnowledgeGroup>()
  for (const item of items) {
    const chapter = (item.chapter || '').trim() || 'Unassigned chapter'
    const subject = (item.subject || '').trim() || 'Subject'
    const key = `${subject}|||${chapter}`
    let group = map.get(key)
    if (!group) {
      group = { subject, chapter, masteryPct: 0, topics: [] }
      map.set(key, group)
    }
    group.topics.push(item)
  }
  return [...map.values()]
    .map((group) => ({
      ...group,
      masteryPct: Math.round(
        group.topics.reduce((sum, row) => sum + row.masteryPct, 0) / Math.max(1, group.topics.length),
      ),
      topics: [...group.topics].sort((a, b) => a.masteryPct - b.masteryPct || a.concept.localeCompare(b.concept)),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.chapter.localeCompare(b.chapter))
}

function BarRow({
  label,
  title,
  pct,
  variant,
  hint,
  subject,
}: {
  label: string
  title?: string
  pct: number
  variant: 'chapter' | 'topic'
  hint?: string
  subject?: string
}) {
  return (
    <div className={`lg-kl-bar-row ${variant}`}>
      <span className="n" title={title ?? label}>
        {label}
        {hint ? <span className="lg-kl-chapter-label">{hint}</span> : null}
      </span>
      <div className="lg-kl-bar-track">
        <div
          className="lg-kl-bar-fill"
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
            background: knowledgeFill(pct, subject),
          }}
        />
      </div>
      <span className="lg-kl-bar-val">{pct}%</span>
    </div>
  )
}

export function KnowledgeChapterTopicBars({
  items,
  emptyNote = 'Chapter and topic scores appear after tagged question attempts.',
}: {
  items: KnowledgeItem[]
  emptyNote?: string
}) {
  const groups = useMemo(() => groupKnowledgeByChapter(items), [items])

  if (items.length === 0) {
    return <p className="lg-kl-note">{emptyNote}</p>
  }

  return (
    <div className="lg-kl-distribution">
      <div className="lg-kl-card">
        <h4>Chapter-wise distribution</h4>
        {groups.map((group) => (
          <BarRow
            key={`ch-${group.subject}-${group.chapter}`}
            variant="chapter"
            label={group.chapter}
            title={`${group.subject} · ${group.chapter}`}
            hint={group.subject}
            pct={group.masteryPct}
            subject={group.subject}
          />
        ))}
      </div>
      <div className="lg-kl-card lg-kl-card-wide">
        <h4>Topic-wise distribution</h4>
        <div className="lg-kl-topic-groups">
          {groups.map((group) => (
            <div key={`tp-${group.subject}-${group.chapter}`} className="lg-kl-topic-group">
              <div className="lg-kl-topic-subject">
                {group.subject} · {group.chapter}
              </div>
              {group.topics.map((row) => (
                <BarRow
                  key={`${group.subject}-${group.chapter}-${row.concept}`}
                  variant="topic"
                  label={row.concept}
                  title={
                    row.correct != null && row.total != null
                      ? `${row.concept} · ${row.correct}/${row.total}`
                      : row.concept
                  }
                  pct={row.masteryPct}
                  subject={row.subject || group.subject}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
