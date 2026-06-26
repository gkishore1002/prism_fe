import { useState } from 'react'
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { AppCard } from '@/components/layout/AppShell'
import { questionUploadPreview } from '@/data/mock'
import { useQuestionPapers } from '@/hooks/useQuestionPapers'
import { cn } from '@/lib/cn'

type UploadFormat = 'excel' | 'csv' | 'other'

const formatLabels: Record<UploadFormat, { label: string; ext: string; icon: typeof FileSpreadsheet }> = {
  excel: { label: 'Excel (.xlsx)', ext: '.xlsx, .xls', icon: FileSpreadsheet },
  csv: { label: 'CSV (.csv)', ext: '.csv', icon: FileText },
  other: { label: 'Other formats', ext: '.json, .tsv, .ods', icon: FileText },
}

const templateColumns = [
  'Board', 'Grade', 'Subject', 'Chapter', 'Topic',
  'Difficulty', 'Marks', 'Question Type', 'Question Text',
  'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer',
]

interface QuestionUploadWorkflowProps {
  onPaperCreated?: (paperId: string) => void
}

export function QuestionUploadWorkflow({ onPaperCreated }: QuestionUploadWorkflowProps) {
  const { addPaperFromUpload } = useQuestionPapers()
  const [format, setFormat] = useState<UploadFormat>('excel')
  const [uploaded, setUploaded] = useState(false)
  const [committed, setCommitted] = useState(false)
  const [paperName, setPaperName] = useState('')

  const validRows = questionUploadPreview.filter((r) => r.valid)
  const invalidRows = questionUploadPreview.filter((r) => !r.valid)
  const FormatIcon = formatLabels[format].icon

  function handleSimulateUpload() {
    setUploaded(true)
    setCommitted(false)
    setPaperName('')
  }

  function handleCommit(e: React.FormEvent) {
    e.preventDefault()
    if (!paperName.trim()) return
    const paper = addPaperFromUpload(paperName.trim(), questionUploadPreview)
    setCommitted(true)
    onPaperCreated?.(paper.id)
  }

  return (
    <div className="space-y-6">
      <AppCard>
        <h3 className="font-display text-lg text-foreground mb-1">Upload Excel → question paper</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload questions in Excel or CSV. Valid rows are saved directly as a question paper — topics are
          taken from the Topic column for filtering when you create assessments.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(formatLabels) as UploadFormat[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setFormat(key); setUploaded(false); setCommitted(false) }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                format === key
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60',
              )}
            >
              {formatLabels[key].label}
            </button>
          ))}
        </div>

        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/40 transition-colors cursor-pointer"
          onClick={handleSimulateUpload}
          onKeyDown={(e) => e.key === 'Enter' && handleSimulateUpload()}
          role="button"
          tabIndex={0}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            Drop your file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Accepts {formatLabels[format].ext}
          </p>
          {uploaded && (
            <p className="text-xs text-leaf mt-3 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              grade8_math_questions.{format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'json'} — parsed
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-md text-xs hover:bg-secondary/60"
          >
            <Download className="w-3.5 h-3.5" />
            Download Excel template
          </button>
        </div>
      </AppCard>

      <AppCard>
        <h3 className="font-display text-lg text-foreground mb-1">Template columns</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Mandatory tags per BRD — Board, Grade, Subject, Chapter, Topic, Difficulty, Marks, Question Type.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {templateColumns.map((col) => (
            <span
              key={col}
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-secondary text-muted-foreground"
            >
              {col}
            </span>
          ))}
        </div>
      </AppCard>

      {uploaded && (
        <AppCard>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-lg text-foreground">Validation preview</h3>
              <p className="text-sm text-muted-foreground">
                {validRows.length} valid · {invalidRows.length} need fixes
              </p>
            </div>
            {!committed && (
              <form onSubmit={handleCommit} className="flex flex-col sm:flex-row gap-2 sm:items-end w-full sm:w-auto">
                <label className="flex-1 sm:min-w-[220px]">
                  <span className="text-xs text-muted-foreground">Question paper name *</span>
                  <input
                    required
                    value={paperName}
                    onChange={(e) => setPaperName(e.target.value)}
                    placeholder="e.g. Grade 8 Algebra — Full paper"
                    className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </label>
                <button
                  type="submit"
                  className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shrink-0"
                >
                  Save as question paper
                </button>
              </form>
            )}
            {committed && (
              <span className="text-sm text-leaf inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Saved as question paper
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Row</th>
                  <th className="pb-3 font-medium">Question</th>
                  <th className="pb-3 font-medium">Hierarchy</th>
                  <th className="pb-3 font-medium">Tags</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {questionUploadPreview.map((row) => (
                  <tr key={row.row} className={row.valid ? '' : 'bg-rose/5'}>
                    <td className="py-3 font-mono-data text-muted-foreground">{row.row}</td>
                    <td className="py-3 max-w-xs">
                      <p className="line-clamp-2 text-foreground">{row.text}</p>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {row.board} · G{row.grade || '—'}
                      <br />
                      {row.subject} / {row.chapter} / {row.topic}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {row.difficulty} · {row.marks}m · {row.questionType}
                    </td>
                    <td className="py-3">
                      {row.valid ? (
                        <span className="inline-flex items-center gap-1 text-leaf text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 text-rose text-xs">
                            <XCircle className="w-3.5 h-3.5" /> Invalid
                          </span>
                          <p className="text-[10px] text-rose mt-0.5">{row.errors.join(', ')}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invalidRows.length > 0 && !committed && (
            <p className="text-xs text-muted-foreground mt-4">
              Fix flagged rows in your file and re-upload. Valid rows can be saved as a paper now.
            </p>
          )}
        </AppCard>
      )}

      {!uploaded && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FormatIcon className="w-4 h-4" />
          <span>Each upload becomes one question paper, categorized by topics from your file.</span>
        </div>
      )}
    </div>
  )
}
