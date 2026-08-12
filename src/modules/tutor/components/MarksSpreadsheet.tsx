import { ChevronDown, Plus, Settings2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppDropdown } from '@/components/ui/AppDropdown'
import { cn } from '@/lib/cn'

export interface MarksColumnConfig {
  id: string
  subject: string
  conductedOn: string
  maxMarks: number
}

export function createMarksColumn(partial?: Partial<MarksColumnConfig>): MarksColumnConfig {
  return {
    id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: '',
    conductedOn: new Date().toISOString().slice(0, 10),
    maxMarks: 50,
    ...partial,
  }
}

/** marks[columnId][studentId] */
export type MarksGrid = Record<string, Record<string, string>>

interface MarksSpreadsheetProps {
  students: { id: string; name: string }[]
  columns: MarksColumnConfig[]
  marks: MarksGrid
  onMarksChange?: (columnId: string, studentId: string, value: string) => void
  onColumnChange?: (columnId: string, patch: Partial<MarksColumnConfig>) => void
  onAddColumn?: () => void
  onRemoveColumn?: (columnId: string) => void
  /** Subject names from Curriculum setup for the selected batch. */
  subjectOptions?: string[]
  readOnly?: boolean
  /** Keep column settings editable while mark cells stay read-only (upload preview). */
  marksReadOnly?: boolean
  emptyMessage?: string
  className?: string
}

export function MarksSpreadsheet({
  students,
  columns,
  marks,
  onMarksChange,
  onColumnChange,
  onAddColumn,
  onRemoveColumn,
  subjectOptions = [],
  readOnly = false,
  marksReadOnly = false,
  emptyMessage = 'Select a batch to load students.',
  className,
}: MarksSpreadsheetProps) {
  const cellsReadOnly = readOnly || marksReadOnly
  const [activeColumnId, setActiveColumnId] = useState(columns[0]?.id ?? '')
  const [settingsOpen, setSettingsOpen] = useState(true)

  useEffect(() => {
    if (!columns.some((c) => c.id === activeColumnId)) {
      setActiveColumnId(columns[0]?.id ?? '')
    }
  }, [columns, activeColumnId])

  const activeColumn = columns.find((c) => c.id === activeColumnId) ?? columns[0]
  const colSpan = 2 + Math.max(columns.length, 1)

  const subjectSelectOptions = useMemo(
    () => subjectOptions.map((name) => ({ value: name, label: name })),
    [subjectOptions],
  )

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden bg-card', className)}>
      {!readOnly && columns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
          {columns.map((col, idx) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveColumnId(col.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors',
                activeColumnId === col.id
                  ? 'border-accent bg-accent/15 text-foreground font-medium'
                  : 'border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              {col.subject.trim() || `Column ${idx + 1}`}
              {col.maxMarks > 0 && (
                <span className="text-muted-foreground font-mono-data">/{col.maxMarks}</span>
              )}
            </button>
          ))}
          {onAddColumn && (
            <button
              type="button"
              onClick={onAddColumn}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent"
            >
              <Plus className="w-3.5 h-3.5" />
              Add column
            </button>
          )}
        </div>
      )}

      {!readOnly && activeColumn && (
        <div className="border-b border-border bg-secondary/15">
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Column settings
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', settingsOpen && 'rotate-180')} />
            </button>
            {onRemoveColumn && columns.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveColumn(activeColumn.id)}
                className="inline-flex items-center gap-1 text-xs text-rose hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove column
              </button>
            )}
          </div>
          {settingsOpen && (
            <div className="grid sm:grid-cols-3 gap-3 px-4 pb-3">
              <div className="block">
                <AppDropdown
                  label="Subject"
                  value={activeColumn.subject || null}
                  onChange={(v) => onColumnChange?.(activeColumn.id, { subject: v })}
                  options={subjectSelectOptions}
                  placeholder="Select subject…"
                  searchable={subjectSelectOptions.length > 6}
                  disabled={subjectSelectOptions.length === 0}
                  emptyMessage="No subjects in curriculum setup"
                  className="mt-1"
                />
                {subjectSelectOptions.length === 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Add subjects under Curriculum setup for this batch&apos;s board and grade.
                  </p>
                )}
              </div>
              <label className="block">
                <span className="text-xs text-muted-foreground">Date of conduction</span>
                <input
                  type="date"
                  value={activeColumn.conductedOn}
                  onChange={(e) => onColumnChange?.(activeColumn.id, { conductedOn: e.target.value })}
                  className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Out of (max marks)</span>
                <input
                  type="number"
                  min={1}
                  value={activeColumn.maxMarks || ''}
                  onChange={(e) =>
                    onColumnChange?.(activeColumn.id, { maxMarks: Number(e.target.value) || 0 })
                  }
                  placeholder="e.g. 50"
                  className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background font-mono-data"
                />
              </label>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px] border-collapse">
          <thead>
            <tr className="bg-secondary/40">
              <th className="w-10 px-2 py-2.5 text-center text-xs text-muted-foreground border border-border font-medium">
                #
              </th>
              <th className="min-w-[180px] px-3 py-2.5 text-left text-xs text-muted-foreground border border-border font-medium sticky left-0 bg-secondary/40 z-10">
                Student
              </th>
              {columns.map((col, idx) => (
                <th
                  key={col.id}
                  className={cn(
                    'min-w-[120px] px-3 py-2.5 text-center text-xs border border-border font-medium',
                    !readOnly && activeColumnId === col.id && 'bg-accent/10 text-foreground',
                  )}
                >
                  <span className="block truncate">{col.subject.trim() || `Column ${idx + 1}`}</span>
                  <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                    {col.maxMarks > 0 ? `/ ${col.maxMarks}` : 'Set max'}
                  </span>
                  {col.conductedOn && (
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      {col.conductedOn}
                    </span>
                  )}
                </th>
              ))}
              {columns.length === 0 && (
                <th className="min-w-[120px] px-3 py-2.5 text-center text-xs text-muted-foreground border border-border">
                  Marks
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-24 text-center text-muted-foreground border border-border"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-accent/5">
                  <td className="px-2 py-1.5 text-center text-xs text-muted-foreground border border-border font-mono-data">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-1.5 font-medium text-foreground border border-border sticky left-0 bg-card z-[1]">
                    {student.name}
                  </td>
                  {columns.map((col) => {
                    const raw = marks[col.id]?.[student.id] ?? ''
                    const num = raw === '' ? null : Number(raw)
                    const invalid =
                      num != null &&
                      (Number.isNaN(num) ||
                        num < 0 ||
                        (col.maxMarks > 0 && num > col.maxMarks))
                    return (
                      <td key={col.id} className="p-0 border border-border">
                        {cellsReadOnly ? (
                          <div className="px-3 py-2 text-center font-mono-data">{raw || '—'}</div>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={col.maxMarks > 0 ? col.maxMarks : undefined}
                            value={raw}
                            onChange={(e) => onMarksChange?.(col.id, student.id, e.target.value)}
                            placeholder="—"
                            className={cn(
                              'w-full h-full px-3 py-2 text-center font-mono-data bg-transparent outline-none focus:bg-accent/10 min-w-[100px]',
                              invalid && 'text-rose bg-rose/5',
                            )}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}