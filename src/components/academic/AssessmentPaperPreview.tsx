import { AppCard } from '@/components/layout/AppShell'
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

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin border border-border rounded-md p-3">
        <ol className="space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="text-sm text-foreground pl-3 border-l-2 border-border">
              <span className="text-xs text-muted-foreground font-mono-data mr-2">Q{i + 1}.</span>
              <span className="line-clamp-2">{q.text}</span>
              <span className="text-[10px] text-muted-foreground ml-1">
                · {q.marks} mark{q.marks !== 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </AppCard>
  )
}