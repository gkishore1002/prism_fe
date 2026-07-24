import { useMemo, useState } from 'react'
import { AppSelect } from '@/components/ui/AppSelect'
import { BatchStudentSearchList } from '@/components/academic/BatchStudentSearchList'
import type { StudentSummary } from '@/types'

function batchLabel(student: StudentSummary): string {
  if (!student.batch?.trim()) return 'No batch yet'
  return `In ${student.batch}`
}

interface BatchStudentPickerProps {
  students: StudentSummary[]
  selectedIds: string[]
  onToggle: (studentId: string) => void
  emptyMessage?: string
  listSearchPlaceholder?: string
  dropdownLabel?: string
  listLabel?: string
  /** When true, each pick assigns immediately (edit batch) instead of multi-select. */
  assignOnPick?: boolean
}

export function BatchStudentPicker({
  students,
  selectedIds,
  onToggle,
  emptyMessage = 'No students in your institution yet.',
  listSearchPlaceholder = 'Search students by name or batch…',
  dropdownLabel = 'Quick add from dropdown',
  listLabel = 'Search and pick from list',
  assignOnPick = false,
}: BatchStudentPickerProps) {
  const [dropdownValue, setDropdownValue] = useState<string | null>(null)

  const dropdownOptions = useMemo(
    () =>
      students
        .filter((s) => assignOnPick || !selectedIds.includes(s.id))
        .map((s) => ({
          value: s.id,
          label: s.name,
          description: `${batchLabel(s)} · readiness ${s.readiness}%`,
        })),
    [students, selectedIds, assignOnPick],
  )

  function handleDropdownSelect(studentId: string) {
    onToggle(studentId)
    setDropdownValue(null)
  }

  return (
    <div className="space-y-4">
      <AppSelect
        label={dropdownLabel}
        value={dropdownValue}
        onChange={handleDropdownSelect}
        options={dropdownOptions}
        searchable
        searchPlaceholder="Search students…"
        placeholder={
          students.length === 0
            ? 'No students available'
            : dropdownOptions.length === 0
              ? assignOnPick
                ? 'No students available to assign'
                : 'All students already selected'
              : assignOnPick
                ? 'Select a student to assign'
                : 'Select a student to add'
        }
        emptyMessage={emptyMessage}
        searchEmptyMessage="No students match your search"
        disabled={students.length === 0}
      />

      <div>
        <p className="text-xs font-medium text-foreground mb-2">{listLabel}</p>
        <BatchStudentSearchList
          students={students}
          mode="pick"
          selectedIds={assignOnPick ? [] : selectedIds}
          onToggle={onToggle}
          emptyMessage={emptyMessage}
          searchPlaceholder={listSearchPlaceholder}
          maxHeight="max-h-64"
          assignOnPick={assignOnPick}
        />
      </div>

      {students.length > 0 && !assignOnPick && (
        <p className="text-[10px] text-muted-foreground">
          {students.length} student{students.length !== 1 ? 's' : ''} available ·{' '}
          {selectedIds.length} selected
        </p>
      )}
    </div>
  )
}
