import { useMemo, useState } from 'react'
import { Search, UserPlus, UserMinus } from 'lucide-react'
import type { StudentSummary } from '@/types'
import { cn } from '@/lib/cn'

interface BatchStudentSearchListProps {
  students: StudentSummary[]
  mode: 'pick' | 'enrolled'
  selectedIds?: string[]
  onToggle?: (studentId: string) => void
  onRemove?: (studentId: string) => void
  emptyMessage?: string
  searchPlaceholder?: string
  maxHeight?: string
  /** Show "Assign" instead of toggle selected state (immediate assign flow). */
  assignOnPick?: boolean
}

export function BatchStudentSearchList({
  students,
  mode,
  selectedIds = [],
  onToggle,
  onRemove,
  emptyMessage = 'No students found.',
  searchPlaceholder = 'Search students by name…',
  maxHeight = 'max-h-56',
  assignOnPick = false,
}: BatchStudentSearchListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.batch?.toLowerCase().includes(q) ?? false),
    )
  }, [students, search])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="text-sm outline-none bg-transparent w-full"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">{emptyMessage}</p>
      ) : (
        <ul className={cn('space-y-1 overflow-y-auto scrollbar-thin', maxHeight)}>
          {filtered.map((student) => {
            const selected = selectedIds.includes(student.id)
            return (
              <li key={student.id}>
                <div
                  className={cn(
                    'flex items-center justify-between gap-3 p-2.5 rounded-md border transition-colors',
                    mode === 'pick' && selected
                      ? 'bg-accent/10 border-accent/40'
                      : 'bg-card border-border hover:bg-secondary/30',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Readiness {student.readiness}%
                      {student.batch ? ` · ${student.batch}` : ' · No batch yet'}
                      {student.board && student.grade
                        ? ` · ${student.board} ${student.grade}`
                        : ''}
                    </p>
                  </div>
                  {mode === 'pick' ? (
                    <button
                      type="button"
                      onClick={() => onToggle?.(student.id)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-md shrink-0 inline-flex items-center gap-1',
                        !assignOnPick && selected
                          ? 'bg-ink text-paper'
                          : 'border border-border hover:bg-secondary',
                      )}
                    >
                      <UserPlus className="w-3 h-3" />
                      {assignOnPick ? 'Assign' : selected ? 'Selected' : 'Add'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRemove?.(student.id)}
                      className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-secondary shrink-0 inline-flex items-center gap-1 text-muted-foreground hover:text-rose"
                    >
                      <UserMinus className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {search && filtered.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          Showing {filtered.length} of {students.length}
        </p>
      )}
    </div>
  )
}