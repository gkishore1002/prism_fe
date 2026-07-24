import { useMemo } from 'react'
import { BookMarked } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import type { CurriculumBoard } from '@/types/curriculum'

function CompletionCell({ value }: { value: number }) {
  const color =
    value >= 85
      ? 'bg-leaf/15 text-leaf'
      : value >= 70
        ? 'bg-accent/15 text-accent'
        : value > 0
          ? 'bg-rose/10 text-rose'
          : 'bg-secondary text-muted-foreground'

  return (
    <div className={`px-3 py-2 rounded-md ${color} text-center`}>
      <div className="font-mono-data text-lg">{value}%</div>
    </div>
  )
}

export interface SyllabusRow {
  board: string
  grade: string
  subjects: Record<string, number>
}

export function buildSyllabusRows(
  curriculum: CurriculumBoard[],
  boardFilter?: string,
): SyllabusRow[] {
  const boards = boardFilter
    ? curriculum.filter((b) => b.board === boardFilter)
    : curriculum

  const rows: SyllabusRow[] = []
  for (const boardNode of boards) {
    for (const gradeNode of boardNode.grades) {
      const subjects: Record<string, number> = {}
      for (const subjectNode of gradeNode.subjects) {
        const topics = subjectNode.topics
        subjects[subjectNode.name] =
          topics.length === 0
            ? 0
            : Math.round(topics.reduce((sum, topic) => sum + topic.mastery, 0) / topics.length)
      }
      if (Object.keys(subjects).length > 0) {
        rows.push({ board: boardNode.board, grade: gradeNode.grade, subjects })
      }
    }
  }
  return rows
}

interface SyllabusCompletionSectionProps {
  curriculum: CurriculumBoard[]
  boardFilter?: string
  showBoardColumn?: boolean
}

export function SyllabusCompletionSection({
  curriculum,
  boardFilter,
  showBoardColumn = !boardFilter,
}: SyllabusCompletionSectionProps) {
  const rows = useMemo(
    () => buildSyllabusRows(curriculum, boardFilter),
    [curriculum, boardFilter],
  )

  const subjectKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const row of rows) {
      Object.keys(row.subjects).forEach((key) => keys.add(key))
    }
    return [...keys].sort((a, b) => a.localeCompare(b))
  }, [rows])

  return (
    <AppCard className="mb-6">
      <div className="flex items-start gap-3 mb-4">
        <BookMarked className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-lg text-foreground">Syllabus completion</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Average topic mastery by grade and subject from assessments and marks. Updates when you
            add topics or students submit work.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add boards, grades, subjects, and topics above to track syllabus coverage.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                {showBoardColumn && <th className="pb-3 pr-4 font-medium">Board</th>}
                <th className="pb-3 pr-4 font-medium">Grade</th>
                {subjectKeys.map((key) => (
                  <th key={key} className="pb-3 px-2 font-medium text-center">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.board}-${row.grade}`} className="border-t border-border hover:bg-secondary/20">
                  {showBoardColumn && (
                    <td className="py-3.5 pr-4 font-medium text-muted-foreground">{row.board}</td>
                  )}
                  <td className="py-3.5 pr-4 font-medium">{row.grade}</td>
                  {subjectKeys.map((key) => (
                    <td key={key} className="px-2 py-2">
                      <CompletionCell value={row.subjects[key] ?? 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppCard>
  )
}
