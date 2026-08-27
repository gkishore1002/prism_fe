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
} from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import {
  downloadQuestionExcelTemplate,
  downloadQuestionJsonTemplate,
  parseQuestionUploadFile,
  QUESTION_UPLOAD_COLUMNS,
} from '@/lib/questionUploadParse'
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

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)
  const activeStep = uploaded ? 3 : fileLabel ? 2 : 1

  async function handleFile(file: File | undefined) {
    if (!file) return
    setParsing(true)
    setParseError(null)
    setSaveError(null)
    try {
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
  }

  async function handleCommit(e: React.FormEvent) {
    e.preventDefault()
    if (!paperName.trim() || validRows.length === 0 || saving) return
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
            Spreadsheet columns for bulk question intake
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
      <p className="text-xs text-muted-foreground mt-1">.xlsx · .xls · .csv · .json</p>
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
            {fileLabel ? ` · ${fileLabel}` : ''}
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
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resetPreview}
                className="h-10 px-4 rounded-md text-sm border border-border hover:bg-secondary/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={validRows.length === 0 || saving}
                className="h-10 px-4 rounded-md text-sm font-medium bg-ink text-paper disabled:opacity-40"
              >
                {saving ? 'Publishing…' : `Publish ${validRows.length} Qs`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {saveError && <p className="text-sm text-rose px-4 sm:px-5 pt-3">{saveError}</p>}

      <div className="overflow-x-auto max-h-[420px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-[1]">
            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
              <th className="px-4 py-2.5 font-semibold">Row</th>
              <th className="px-4 py-2.5 font-semibold">Question</th>
              <th className="px-4 py-2.5 font-semibold">Academic path</th>
              <th className="px-4 py-2.5 font-semibold">Meta</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.row} className={row.valid ? '' : 'bg-rose/5'}>
                <td className="px-4 py-2.5 font-mono-data text-muted-foreground">{row.row}</td>
                <td className="px-4 py-2.5 max-w-xs">
                  <p className="line-clamp-2 text-foreground">{row.text || '—'}</p>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {row.board || '—'} · G{row.grade || '—'}
                  <br />
                  {row.subject || '—'} / {row.chapter || '—'} / {row.topic || '—'}
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
                  ) : (
                    <span className="inline-flex items-center gap-1 text-leaf text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                </td>
              </tr>
            ))}
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
          Board → Grade → Subject → Chapter → Topic, plus difficulty, marks, type, and text. JSON
          may use {'{ "name": "…", "questions": […] }'}.
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
