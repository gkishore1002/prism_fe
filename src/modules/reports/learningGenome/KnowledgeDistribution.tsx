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
      topics: [...group.topics].sort(
        (a, b) => a.masteryPct - b.masteryPct || a.concept.localeCompare(b.concept),
      ),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.chapter.localeCompare(b.chapter))
}

function shortLabel(value: string, max = 42): string {
  const text = value.trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

/** Drop repeated chapter prefix from a concept label when present. */
export function topicDisplayName(concept: string, chapter?: string): string {
  const raw = (concept || '').trim()
  const ch = (chapter || '').trim()
  if (!raw) return 'Topic'
  if (!ch) return raw
  const prefixes = [
    `${ch} - `,
    `${ch} – `,
    `${ch} — `,
    `${ch} · `,
    `${ch}: `,
    `${ch} / `,
  ]
  for (const prefix of prefixes) {
    if (raw.toLowerCase().startsWith(prefix.toLowerCase())) {
      const rest = raw.slice(prefix.length).trim()
      if (rest) return rest
    }
  }
  return raw
}

function MasteryBar({
  label,
  title,
  pct,
  variant,
  subject,
}: {
  label: string
  title?: string
  pct: number
  variant: 'chapter' | 'topic'
  subject?: string
}) {
  const safePct = Math.min(100, Math.max(0, pct))
  return (
    <div className={`lg-kl-bar-row ${variant}`} data-pdf-bar>
      <span className="n" title={title ?? label}>
        {label}
      </span>
      <div className="lg-kl-bar-track">
        <div
          className="lg-kl-bar-fill"
          style={{
            width: `${safePct}%`,
            background: knowledgeFill(safePct, subject),
          }}
        />
      </div>
      <span className="lg-kl-bar-val">{safePct}%</span>
    </div>
  )
}

/**
 * Compact snapshot for the assessment scorecard — strongest / weakest only.
 * Full chapter→topic hierarchy lives in KnowledgeChapterTopicBars.
 */
export function TopicMasterySnapshot({
  items,
  emptyNote = 'Topic scores appear once questions on this paper are tagged.',
}: {
  items: KnowledgeItem[]
  emptyNote?: string
}) {
  const ranked = useMemo(
    () =>
      [...items].sort(
        (a, b) => b.masteryPct - a.masteryPct || a.concept.localeCompare(b.concept),
      ),
    [items],
  )

  if (items.length === 0) {
    return <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>{emptyNote}</p>
  }

  const overall = Math.round(
    items.reduce((sum, row) => sum + row.masteryPct, 0) / Math.max(1, items.length),
  )
  const strong = ranked.filter((row) => row.masteryPct >= 75).slice(0, 3)
  const weak = [...ranked].reverse().filter((row) => row.masteryPct < 75).slice(0, 3)

  return (
    <div className="lg-topic-snapshot" data-pdf-block>
      <div className="lg-topic-snapshot-overall">
        <span className="lg-topic-snapshot-label">Average topic mastery</span>
        <div className="lg-kl-bar-track lg-topic-snapshot-track">
          <div
            className="lg-kl-bar-fill"
            style={{ width: `${overall}%`, background: knowledgeFill(overall) }}
          />
        </div>
        <span className="lg-kl-bar-val">{overall}%</span>
      </div>

      <div className="lg-topic-snapshot-cols">
        <div>
          <div className="lg-topic-snapshot-heading">Strong</div>
          {strong.length === 0 ? (
            <p className="lg-topic-snapshot-empty">None at 75%+</p>
          ) : (
            <ul className="lg-topic-snapshot-list">
              {strong.map((row) => {
                const name = topicDisplayName(row.concept, row.chapter)
                return (
                  <li key={`s-${row.subject}-${row.chapter}-${row.concept}`}>
                    <span title={row.chapter ? `${row.chapter} · ${name}` : name}>
                      {shortLabel(name, 28)}
                    </span>
                    <em>{row.masteryPct}%</em>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div>
          <div className="lg-topic-snapshot-heading">Focus next</div>
          {weak.length === 0 ? (
            <p className="lg-topic-snapshot-empty">No weak topics</p>
          ) : (
            <ul className="lg-topic-snapshot-list weak">
              {weak.map((row) => {
                const name = topicDisplayName(row.concept, row.chapter)
                return (
                  <li key={`w-${row.subject}-${row.chapter}-${row.concept}`}>
                    <span title={row.chapter ? `${row.chapter} · ${name}` : name}>
                      {shortLabel(name, 28)}
                    </span>
                    <em>{row.masteryPct}%</em>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <p className="lg-topic-snapshot-hint">
        Full chapter and topic bars are in Knowledge Layer below.
      </p>
    </div>
  )
}

export function KnowledgeChapterTopicBars({
  items,
  emptyNote = 'Chapter and topic scores appear after tagged question attempts.',
  maxTopicsPerChapter = 8,
}: {
  items: KnowledgeItem[]
  emptyNote?: string
  /** Cap topics shown under each chapter to keep reports readable. */
  maxTopicsPerChapter?: number
}) {
  const groups = useMemo(() => groupKnowledgeByChapter(items), [items])

  if (items.length === 0) {
    return <p className="lg-kl-note">{emptyNote}</p>
  }

  return (
    <div className="lg-kl-distribution">
      <div className="lg-kl-card" data-pdf-block>
        <h4>Chapter mastery</h4>
        {groups.map((group) => (
          <MasteryBar
            key={`ch-${group.subject}-${group.chapter}`}
            variant="chapter"
            label={shortLabel(group.chapter, 36)}
            title={`${group.subject} · ${group.chapter} · ${group.topics.length} topics`}
            pct={group.masteryPct}
            subject={group.subject}
          />
        ))}
      </div>
      <div className="lg-kl-card lg-kl-card-wide">
        <h4>Topics by chapter</h4>
        <div className="lg-kl-topic-groups">
          {groups.map((group) => {
            const visible = group.topics.slice(0, maxTopicsPerChapter)
            const hidden = group.topics.length - visible.length
            return (
              <div
                key={`tp-${group.subject}-${group.chapter}`}
                className="lg-kl-topic-group"
                data-pdf-block
              >
                <div className="lg-kl-topic-subject" title={`${group.subject} · ${group.chapter}`}>
                  <span className="lg-kl-topic-chapter">{shortLabel(group.chapter, 40)}</span>
                  <span className="lg-kl-topic-meta">
                    {group.masteryPct}% · {group.topics.length} topic
                    {group.topics.length === 1 ? '' : 's'}
                  </span>
                </div>
                {visible.map((row) => {
                  const name = topicDisplayName(row.concept, group.chapter)
                  return (
                    <MasteryBar
                      key={`${group.subject}-${group.chapter}-${row.concept}`}
                      variant="topic"
                      label={shortLabel(name, 34)}
                      title={
                        row.correct != null && row.total != null
                          ? `${name} · ${row.correct}/${row.total}`
                          : name
                      }
                      pct={row.masteryPct}
                      subject={row.subject || group.subject}
                    />
                  )
                })}
                {hidden > 0 ? (
                  <p className="lg-kl-more">+{hidden} more topic{hidden === 1 ? '' : 's'} on this chapter</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
