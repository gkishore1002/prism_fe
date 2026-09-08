import { useRef, useState } from 'react'
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  FileJson,
  ClipboardCheck,
  BookMarked,
  Sparkles,
} from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import {
  applyMappedTopics,
  downloadQuestionExcelTemplate,
  downloadQuestionJsonTemplate,
  parseQuestionUploadFile,
  QUESTION_UPLOAD_COLUMNS,
  validateQuestionUploadRow,
} from '@/lib/questionUploadParse'
import {
  canParseExcelImages,
  parseQuestionUploadExcelWithImages,
} from '@/lib/questionUploadParseExcelImages'
import { mapQuestionTopics } from '@/lib/api/syllabusBooksApi'
import { ApiError, isApiEnabled } from '@/lib/apiClient'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import type { QuestionUploadRow } from '@/types'
import { cn } from '@/lib/cn'

interface QuestionUploadWorkflowProps {
  onPaperCreated?: (paperId: string) => void
  variant?: 'full' | 'minimal'
}

const STEPS = [
  { id: 1, label: 'Template', icon: Download },
  { id: 2, label: 'Upload', icon: Upload },
  { id: 3, label: 'Validate', icon: ClipboardCheck },
  { id: 4, label: 'Publish', icon: BookMarked },
] as const

export function QuestionUploadWorkflow({
  onPaperCreated,
  variant = 'minimal',
}: QuestionUploadWorkflowProps) {
  const { addPaperFromUpload } = useQuestionPapers()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<QuestionUploadRow[]>([])
  const [uploaded, setUploaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [paperName, setPaperName] = useState('')
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [mappingTopics, setMappingTopics] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapNote, setMapNote] = useState<string | null>(null)
  const [mappedRowIds, setMappedRowIds] = useState<number[]>([])
  const [showTopicReview, setShowTopicReview] = useState(false)
  const [imageParseNote, setImageParseNote] = useState<string | null>(null)

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)
  const blankTopicRows = rows.filter((r) => r.valid && !r.topic.trim())
  const activeStep = uploaded ? 3 : fileLabel ? 2 : 1

  async function handleFile(file: File | undefined) {
    if (!file) return
    setParsing(true)
    setParseError(null)
    setSaveError(null)
    setMapError(null)
    setMapNote(null)
    setImageParseNote(null)
    setMappedRowIds([])
    setShowTopicReview(false)
    try {
      if (canParseExcelImages(file.name)) {
        try {
          const excel = await parseQuestionUploadExcelWithImages(file)
          setRows(excel.rows)
          setUploaded(true)
          setFileLabel(file.name)
          if (excel.suggestedName) setPaperName(excel.suggestedName)
          else {
            const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
            setPaperName(base)
          }
          const bits: string[] = []
          if (excel.meta.mappedCount > 0) {
            bits.push(
              `Linked ${excel.meta.mappedCount} cell image${excel.meta.mappedCount === 1 ? '' : 's'} to questions.`,
            )
          } else if (excel.meta.imageCount > 0) {
            bits.push(
              `Found ${excel.meta.imageCount} image(s) but none mapped — put each photo in the Question Text or Option A–D cell on that row (Excel: Insert → Pictures → Place in Cell).`,
            )
          } else if (excel.meta.warnings.some((w) => /no embedded sheet images/i.test(w))) {
            bits.push(
              'No images detected in this .xlsx. Use Excel Place in Cell on Question Text / Option columns, then re-save as Excel 2010–365 (.xlsx). Floating / LibreOffice images often do not import.',
            )
          }
          if (excel.meta.warnings.length) {
            bits.push(excel.meta.warnings.slice(0, 2).join(' '))
          }
          setImageParseNote(bits.length ? bits.join(' ') : null)
          return
        } catch (err) {
          // Fall through to text-only parser
          console.warn('Excel image parse failed, using text parser', err)
        }
      }

      const result = await parseQuestionUploadFile(file)
      if (!result.ok) {
        setUploaded(false)
        setRows([])
        setFileLabel(null)
        setParseError(result.error)
        return
      }
      setRows(result.rows)
      setUploaded(true)
      setFileLabel(file.name)
      if (result.suggestedName) setPaperName(result.suggestedName)
      else {
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
        setPaperName(base)
      }
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function resetPreview() {
    setUploaded(false)
    setRows([])
    setFileLabel(null)
    setPaperName('')
    setParseError(null)
    setSaveError(null)
    setMapError(null)
    setMapNote(null)
    setImageParseNote(null)
    setMappedRowIds([])
    setShowTopicReview(false)
    setMappingTopics(false)
  }

  function updateRowTopic(rowNumber: number, topic: string) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.row !== rowNumber) return row
        const { valid: _valid, errors: _errors, ...partial } = row
        return validateQuestionUploadRow({ ...partial, topic })
      }),
    )
  }

  async function handleUpdateTopics() {
    if (mappingTopics || saving || blankTopicRows.length === 0) return
    if (!isApiEnabled()) {
      setMapError('Connect to the Prism API to map topics from syllabus books.')
      return
    }
    setMappingTopics(true)
    setMapError(null)
    setMapNote(null)
    try {
      const payload = blankTopicRows.map((row) => ({
        row: row.row,
        board: row.board,
        grade: row.grade,
        subject: row.subject,
        chapter: row.chapter,
        text: row.text,
        topic: row.topic,
      }))
      const { mappings } = await mapQuestionTopics(payload)
      const next = applyMappedTopics(rows, mappings)
      const newlyMapped = mappings
        .filter((m) => m.topic.trim())
        .map((m) => m.row)
      const filled = newlyMapped.filter((rowNum) => {
        const before = rows.find((r) => r.row === rowNum)
        return before && !before.topic.trim()
      }).length
      setRows(next)
      setMappedRowIds(newlyMapped)
      setShowTopicReview(newlyMapped.length > 0)
      setMapNote(
        filled > 0
          ? `Mapped topics onto ${filled} question${filled === 1 ? '' : 's'} from the syllabus book outline. Review and edit below before publishing.`
          : 'No topics were mapped. Upload an analyzed syllabus book for this board / grade / subject, then try again.',
      )
    } catch (err) {
      setMapError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Topic mapping failed',
      )
    } finally {
      setMappingTopics(false)
    }
  }

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault()
    if (!paperName.trim() || validRows.length === 0 || saving || mappingTopics) return
    setSaving(true)
    setSaveError(null)
    try {
      const paper = await addPaperFromUpload(paperName.trim(), rows)
      onPaperCreated?.(paper.id)
      resetPreview()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save question paper')
    } finally {
      setSaving(false)
    }
  }

  const stepRail = (
    <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
      {STEPS.map(({ id, label, icon: Icon }) => {
        const done = activeStep > id || (id === 4 && saving)
        const current = activeStep === id
        return (
          <li
            key={id}
            className={cn(
              'flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs',
              current
                ? 'border-accent/50 bg-accent/10 text-foreground'
                : done
                  ? 'border-leaf/30 bg-leaf/5 text-leaf'
                  : 'border-border bg-card text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                current ? 'bg-accent text-accent-foreground' : done ? 'bg-leaf text-white' : 'bg-secondary',
              )}
            >
              {done && !current ? '✓' : id}
            </span>
            <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="font-medium">{label}</span>
          </li>
        )
      })}
    </ol>
  )

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".xlsx,.xls,.csv,.json,application/json,text/csv"
      className="hidden"
      onChange={(e) => void handleFile(e.target.files?.[0])}
    />
  )

  const templateActions = (
    <div className="space-y-3">
      <div className="rounded-[12px] border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
        <p className="font-semibold text-foreground">Photo questions (formulas / diagrams)</p>
        <ol className="mt-2 list-decimal pl-4 space-y-1 text-xs text-muted-foreground">
          <li>Download the Excel template (.xlsx).</li>
          <li>
            Select the <span className="font-medium text-foreground">Question Text</span> or{' '}
            <span className="font-medium text-foreground">Option A–D</span> cell.
          </li>
          <li>
            Use <span className="font-medium text-foreground">Insert → Pictures → Place in Cell</span>{' '}
            (not “Place over Cells”).
          </li>
          <li>One photo per cell. Text in the cell is optional when a photo is present.</li>
          <li>.csv / .xls stay text-only — use .xlsx for images.</li>
        </ol>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => downloadQuestionExcelTemplate()}
        className="flex items-start gap-3 rounded-[12px] border border-border bg-card p-3.5 text-left hover:border-accent/40 hover:bg-accent/5 transition-colors"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper shrink-0">
          <FileSpreadsheet className="w-4 h-4 text-accent" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">Excel / CSV template</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            Spreadsheet columns — use .xlsx + Place in Cell for photos
          </span>
        </span>
        <Download className="w-4 h-4 text-muted-foreground ml-auto shrink-0 mt-1" />
      </button>
      <button
        type="button"
        onClick={() => downloadQuestionJsonTemplate()}
        className="flex items-start gap-3 rounded-[12px] border border-border bg-card p-3.5 text-left hover:border-accent/40 hover:bg-accent/5 transition-colors"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper shrink-0">
          <FileJson className="w-4 h-4 text-accent" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">JSON template</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            API-friendly payload with optional paper name
          </span>
        </span>
        <Download className="w-4 h-4 text-muted-foreground ml-auto shrink-0 mt-1" />
      </button>
      </div>
    </div>
  )

  const dropZone = (
    <div
      className={cn(
        'rounded-[14px] border-2 border-dashed border-border bg-ink/[0.02] p-6 sm:p-8 text-center',
        'hover:border-accent/45 hover:bg-accent/[0.04] transition-colors cursor-pointer',
        parsing && 'opacity-60 pointer-events-none',
      )}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void handleFile(e.dataTransfer.files?.[0])
      }}
      role="button"
      tabIndex={0}
    >
      {parsing ? (
        <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-spin" />
      ) : (
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      )}
      <p className="text-sm font-semibold text-foreground">
        {parsing ? 'Validating file…' : 'Drop file or click to browse'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        .xlsx (text + Place in Cell photos) · .xls / .csv / .json (text only)
      </p>
      {fileLabel && (
        <p className="text-xs text-leaf mt-2 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {fileLabel}
        </p>
      )}
    </div>
  )

  const preview = uploaded ? (
    <div className="rounded-[14px] border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-border space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Step 3–4 · Validate & publish
          </div>
          <h3 className="font-display text-lg text-foreground mt-1">Import review</h3>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-leaf font-medium">{validRows.length} valid</span>
            {' · '}
            <span className={invalidRows.length ? 'text-rose font-medium' : ''}>
              {invalidRows.length} need fixes
            </span>
            {blankTopicRows.length > 0 ? (
              <>
                {' · '}
                <span className="text-amber-700 font-medium">
                  {blankTopicRows.length} missing topic
                </span>
              </>
            ) : null}
            {fileLabel ? ` · ${fileLabel}` : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            Chapter is required. Topic is optional in the file — use Update topics to map from an
            analyzed syllabus book before publish.
          </p>
        </div>

        <form onSubmit={(e) => void handleCommit(e)} className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <label className="block flex-1 min-w-0">
              <span className="mb-1.5 block text-xs text-muted-foreground">Paper title in library *</span>
              <input
                required
                value={paperName}
                onChange={(e) => setPaperName(e.target.value)}
                placeholder="e.g. Grade 8 Algebra — Term 1"
                className="h-10 w-full border border-border rounded-md px-3 text-sm bg-background"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resetPreview}
                className="btn btn-secondary shrink-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateTopics()}
                disabled={blankTopicRows.length === 0 || mappingTopics || saving}
                className="btn btn-secondary shrink-0 disabled:opacity-40 border-accent/40 bg-accent/10 hover:bg-accent/15"
                title={
                  blankTopicRows.length === 0
                    ? 'All ready rows already have a topic'
                    : 'Map blank topics from analyzed syllabus books'
                }
              >
                {mappingTopics ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                )}
                {mappingTopics ? 'Updating topics…' : 'Update topics'}
              </button>
              <button
                type="submit"
                disabled={validRows.length === 0 || saving || mappingTopics}
                className="btn btn-primary shrink-0 disabled:opacity-40"
              >
                {saving ? 'Publishing…' : `Publish ${validRows.length} Qs`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {mapError && <p className="text-sm text-rose px-4 sm:px-5 pt-3">{mapError}</p>}
      {mapNote && !mapError && <p className="text-sm text-leaf px-4 sm:px-5 pt-3">{mapNote}</p>}
      {saveError && <p className="text-sm text-rose px-4 sm:px-5 pt-3">{saveError}</p>}

      {showTopicReview && mappedRowIds.length > 0 && (
        <div className="mx-4 sm:mx-5 mt-3 mb-1 rounded-[12px] border border-accent/35 bg-accent/5 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Mapped topics from syllabus books</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review the topics Vertex mapped. Edit any that look wrong, then continue to publish.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTopicReview(false)}
              className="h-8 px-3 rounded-md text-xs border border-border hover:bg-secondary/60"
            >
              Done reviewing
            </button>
          </div>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {rows
              .filter((row) => mappedRowIds.includes(row.row))
              .map((row) => (
                <li
                  key={`mapped-${row.row}`}
                  className="grid grid-cols-1 sm:grid-cols-[3rem_1fr_minmax(10rem,14rem)] gap-2 items-start rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <span className="font-mono-data text-xs text-muted-foreground pt-2">#{row.row}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{row.text || '—'}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {row.chapter || '—'} · {row.subject || '—'}
                    </p>
                  </div>
                  <label className="block">
                    <span className="sr-only">Topic for row {row.row}</span>
                    <input
                      value={row.topic}
                      onChange={(e) => updateRowTopic(row.row, e.target.value)}
                      className="h-9 w-full border border-accent/40 rounded-md px-2.5 text-sm bg-background"
                      placeholder="Topic"
                    />
                  </label>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto max-h-[420px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-[1]">
            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
              <th className="px-4 py-2.5 font-semibold">Row</th>
              <th className="px-4 py-2.5 font-semibold">Question</th>
              <th className="px-4 py-2.5 font-semibold">Academic path</th>
              <th className="px-4 py-2.5 font-semibold">Topic</th>
              <th className="px-4 py-2.5 font-semibold">Meta</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const wasMapped = mappedRowIds.includes(row.row)
              return (
                <tr
                  key={row.row}
                  className={cn(
                    !row.valid && 'bg-rose/5',
                    wasMapped && row.valid && 'bg-accent/[0.04]',
                  )}
                >
                  <td className="px-4 py-2.5 font-mono-data text-muted-foreground">{row.row}</td>
                  <td className="px-4 py-2.5 max-w-sm">
                    <div className="space-y-2">
                      <p className="line-clamp-2 text-foreground">{row.text || (row.textImagePreviewUrl ? 'Image question' : '—')}</p>
                      {(row.textImagePreviewUrl ||
                        row.optionAImagePreviewUrl ||
                        row.optionBImagePreviewUrl ||
                        row.optionCImagePreviewUrl ||
                        row.optionDImagePreviewUrl) && (
                        <div className="flex flex-wrap gap-1.5">
                          {row.textImagePreviewUrl && (
                            <img
                              src={row.textImagePreviewUrl}
                              alt="Question"
                              className="h-14 w-auto max-w-[7rem] rounded-md border border-border object-contain bg-secondary/40"
                            />
                          )}
                          {(
                            [
                              ['A', row.optionAImagePreviewUrl],
                              ['B', row.optionBImagePreviewUrl],
                              ['C', row.optionCImagePreviewUrl],
                              ['D', row.optionDImagePreviewUrl],
                            ] as const
                          )
                            .filter(([, url]) => Boolean(url))
                            .map(([label, url]) => (
                              <div key={label} className="relative">
                                <img
                                  src={url!}
                                  alt={`Option ${label}`}
                                  className="h-12 w-auto max-w-[5.5rem] rounded-md border border-border object-contain bg-secondary/40"
                                />
                                <span className="absolute -top-1 -left-1 text-[9px] font-semibold bg-ink text-paper rounded px-1 leading-4">
                                  {label}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {row.board || '—'} · G{row.grade || '—'}
                    <br />
                    {row.subject || '—'} / {row.chapter || '—'}
                  </td>
                  <td className="px-4 py-2.5 min-w-[9rem]">
                    {row.valid ? (
                      <input
                        value={row.topic}
                        onChange={(e) => updateRowTopic(row.row, e.target.value)}
                        className={cn(
                          'h-8 w-full border rounded-md px-2 text-xs bg-background',
                          wasMapped ? 'border-accent/50' : 'border-border',
                          !row.topic.trim() && 'border-amber-500/50',
                        )}
                        placeholder="Topic"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{row.topic || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {row.difficulty || '—'} · {Number.isFinite(row.marks) ? `${row.marks}m` : '—'} ·{' '}
                    {row.questionType || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {!row.valid ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-rose text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Blocked
                        </span>
                        <p className="text-[10px] text-rose mt-0.5">{row.errors.join(', ')}</p>
                      </div>
                    ) : !row.topic.trim() ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium">
                        <Sparkles className="w-3.5 h-3.5" /> Needs topic
                      </span>
                    ) : wasMapped ? (
                      <span className="inline-flex items-center gap-1 text-accent text-xs font-medium">
                        <Sparkles className="w-3.5 h-3.5" /> Mapped
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-leaf text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {invalidRows.length > 0 && (
        <p className="text-xs text-muted-foreground px-4 py-3 border-t border-border">
          Fix blocked rows in the source file and re-upload. Only ready rows are published.
        </p>
      )}
    </div>
  ) : null

  if (variant === 'minimal') {
    return (
      <div>
        {fileInput}
        {stepRail}
        {templateActions}
        <div className="mt-3">{dropZone}</div>
        <p className="text-xs text-muted-foreground mt-2">
          Learning portal intake: validated rows publish as one reusable paper.
        </p>
        {parseError && <p className="text-sm text-rose mt-2">{parseError}</p>}
        {imageParseNote && (
          <p className="text-xs text-muted-foreground mt-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
            {imageParseNote}
          </p>
        )}
        {preview && <div className="mt-4">{preview}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fileInput}
      <AppCard className="p-4 sm:p-5">
        {stepRail}
        <div className="mb-4">
          <h3 className="font-display text-lg text-foreground">Content import console</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Bring question inventory from spreadsheets or JSON into the assessment library — same
            pattern as ERP bulk masters.
          </p>
        </div>
        {templateActions}
        <div className="mt-4">{dropZone}</div>
        {parseError && <p className="text-sm text-rose mt-3">{parseError}</p>}
      </AppCard>

      <AppCard className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Required schema</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Board → Grade → Subject → Chapter (required) → Topic (optional; use Update topics), plus
          difficulty, marks, type, and text. JSON may use{' '}
          {'{ "name": "…", "questions": […] }'}.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUESTION_UPLOAD_COLUMNS.map((col) => (
            <span
              key={col}
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-secondary text-muted-foreground font-medium"
            >
              {col}
            </span>
          ))}
        </div>
      </AppCard>

      {preview}
    </div>
  )
}
