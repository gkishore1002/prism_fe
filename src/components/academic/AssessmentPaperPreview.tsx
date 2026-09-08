import { AppCard } from '@/components/layout/AppShell'
import { AuthImage } from '@/components/ui/AuthImage'
import type { QuestionBankEntry } from '@/types'
import { cn } from '@/lib/cn'

interface AssessmentPaperPreviewProps {
  paperName: string
  paperCoverage: 'full' | 'selected_topics'
  selectedTopics: string[]
  questions: QuestionBankEntry[]
  totalMarks: number
  className?: string
}

function PreviewOptions({ q }: { q: QuestionBankEntry }) {
  const opts = [
    (q.optionA || q.optionAImageUrl) && {
      key: 'A',
      label: q.optionA,
      imageUrl: q.optionAImageUrl,
    },
    (q.optionB || q.optionBImageUrl) && {
      key: 'B',
      label: q.optionB,
      imageUrl: q.optionBImageUrl,
    },
    (q.optionC || q.optionCImageUrl) && {
      key: 'C',
      label: q.optionC,
      imageUrl: q.optionCImageUrl,
    },
    (q.optionD || q.optionDImageUrl) && {
      key: 'D',
      label: q.optionD,
      imageUrl: q.optionDImageUrl,
    },
  ].filter(Boolean) as { key: string; label?: string; imageUrl?: string }[]

  if (opts.length === 0) return null

  return (
    <div className="mt-2 grid sm:grid-cols-2 gap-1.5">
      {opts.map((opt) => (
        <div
          key={opt.key}
          className="text-xs px-2 py-1.5 rounded-md border border-border/80 bg-secondary/20 space-y-1.5"
        >
          <div>
            <span className="font-mono-data text-[10px] text-muted-foreground mr-1.5">{opt.key}.</span>
            {opt.label ? <span className="text-foreground">{opt.label}</span> : null}
          </div>
          {opt.imageUrl ? (
            <AuthImage mediaPath={opt.imageUrl} className="max-h-24 w-auto rounded border border-border object-contain bg-card" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function AssessmentPaperPreview({
  paperName,
  paperCoverage,
  selectedTopics,
  questions,
  totalMarks,
  className,
}: AssessmentPaperPreviewProps) {
  if (questions.length === 0) {
    return (
      <AppCard className={cn('!p-4', className)}>
        <p className="text-sm text-muted-foreground text-center py-4">
          {paperCoverage === 'selected_topics'
            ? 'Select at least one topic to preview questions in this paper.'
            : 'No questions in this paper.'}
        </p>
      </AppCard>
    )
  }

  return (
    <AppCard className={cn('!p-4 space-y-4', className)}>
      <div>
        <p className="text-xs font-medium text-foreground">Question paper preview</p>
        <p className="text-sm text-muted-foreground mt-1">
          {paperCoverage === 'full' ? 'Full paper' : 'Topic-wise'} · &ldquo;{paperName}&rdquo; ·{' '}
          {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} marks
        </p>
        {paperCoverage === 'selected_topics' && selectedTopics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedTopics.map((topic) => (
              <span
                key={topic}
                className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-[28rem] overflow-y-auto scrollbar-thin border border-border rounded-md p-3">
        <ol className="space-y-3">
          {questions.map((q, i) => (
            <li key={q.id} className="text-sm text-foreground pl-3 border-l-2 border-border">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-xs text-muted-foreground font-mono-data">Q{i + 1}.</span>
                <span className={cn(!q.text?.trim() && q.textImageUrl ? 'text-muted-foreground italic' : '')}>
                  {q.text?.trim() || (q.textImageUrl ? 'Image question' : '—')}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  · {q.marks} mark{q.marks !== 1 ? 's' : ''}
                </span>
              </div>
              {q.textImageUrl ? (
                <div className="mt-2">
                  <AuthImage
                    mediaPath={q.textImageUrl}
                    className="max-h-36 w-auto rounded-md border border-border object-contain bg-secondary/30"
                  />
                </div>
              ) : null}
              <PreviewOptions q={q} />
            </li>
          ))}
        </ol>
      </div>
    </AppCard>
  )
}
