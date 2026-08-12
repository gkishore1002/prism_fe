import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileSpreadsheet,
  PenLine,
  Save,
  Upload,
  X,
} from 'lucide-react'
import { PageHeader, AppCard, AppStat } from '@/components/layout/AppShell'
import { InlineLoader } from '@/components/ui/PrismLoader'
import { AppDropdown } from '@/components/ui/AppDropdown'
import {
  MarksSpreadsheet,
  createMarksColumn,
  type MarksColumnConfig,
  type MarksGrid,
} from '@/modules/tutor/components/MarksSpreadsheet'
import { useCurriculum } from '@/hooks/useCurriculum'
import { fetchStudentsForBatch } from '@/lib/api/curriculumApi'
import {
  getCurriculumSubjectsForBatch,
  mapSubjectLabelToCurriculum,
} from '@/lib/academicScope'
import {
  applyParsedSpreadsheetToGrid,
  groupMarksBySession,
  exportMarksSpreadsheetFile,
  pct,
  sessionToSpreadsheet,
  type MarksActivitySession,
  type MarksRecord,
  type MarksSource,
} from '@/modules/tutor/lib/marksStorage'
import {
  exportAllMarksSessionsXlsx,
  downloadSpreadsheetTemplateCsv,
  downloadSpreadsheetTemplateXlsx,
  isMarksUploadFileName,
  parseMarksUploadFile,
} from '@/modules/tutor/lib/marksUploadParse'
import {
  downloadMarksExport,
  fetchMarksSessions,
  marksApiAvailable,
  saveMarksBulk,
} from '@/lib/api/marksApi'
import { cn } from '@/lib/cn'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function pickNextSubject(columns: MarksColumnConfig[], subjects: string[]): string {
  const used = new Set(columns.map((c) => c.subject.trim().toLowerCase()).filter(Boolean))
  return subjects.find((s) => !used.has(s.toLowerCase())) ?? ''
}

const TABS = [
  { id: 'recent' as const, label: 'Recent activity', icon: Activity },
  { id: 'upload' as const, label: 'Upload & template', icon: Upload },
  { id: 'manual' as const, label: 'Manual entry', icon: PenLine },
]

type MarksTab = (typeof TABS)[number]['id']

export function TutorMarksPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { batches, curriculum, ensureLoaded } = useCurriculum()

  useEffect(() => {
    void ensureLoaded()
  }, [ensureLoaded])

  const reloadMarks = useCallback(async () => {
    if (!marksApiAvailable()) {
      setOfflineRecords([])
      setLoadingMarks(false)
      return
    }
    setLoadingMarks(true)
    try {
      const sessions = await fetchMarksSessions()
      setOfflineRecords(sessions.flatMap((s) => s.entries))
    } catch {
      setOfflineRecords([])
    } finally {
      setLoadingMarks(false)
    }
  }, [])

  useEffect(() => {
    void reloadMarks()
  }, [reloadMarks])

  const [tab, setTab] = useState<MarksTab>('recent')
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null)

  const [offlineRecords, setOfflineRecords] = useState<MarksRecord[]>([])
  const [loadingMarks, setLoadingMarks] = useState(marksApiAvailable())
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )

  // Manual entry state
  const [batchId, setBatchId] = useState('')
  const [batchStudents, setBatchStudents] = useState<{ id: string; name: string }[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualColumns, setManualColumns] = useState<MarksColumnConfig[]>(() => [createMarksColumn()])
  const [manualMarks, setManualMarks] = useState<MarksGrid>({})

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadBatchId, setUploadBatchId] = useState('')
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [uploadStudents, setUploadStudents] = useState<{ id: string; name: string }[]>([])
  const [loadingUploadStudents, setLoadingUploadStudents] = useState(false)
  const [uploadColumns, setUploadColumns] = useState<MarksColumnConfig[]>(() => [createMarksColumn()])
  const [uploadMarks, setUploadMarks] = useState<MarksGrid>({})
  const [uploadPreviewLoaded, setUploadPreviewLoaded] = useState(false)
  const [uploadParseError, setUploadParseError] = useState<string | null>(null)

  const selectedBatch = batches.find((b) => b.id === batchId)
  const uploadBatch = batches.find((b) => b.id === uploadBatchId)

  const manualSubjectOptions = useMemo(
    () => getCurriculumSubjectsForBatch(curriculum, selectedBatch),
    [curriculum, selectedBatch],
  )

  const uploadSubjectOptions = useMemo(
    () => getCurriculumSubjectsForBatch(curriculum, uploadBatch),
    [curriculum, uploadBatch],
  )

  const batchOptions = useMemo(
    () => [
      { value: '', label: 'Select batch…' },
      ...batches.map((b) => ({
        value: b.id,
        label: `${b.name} · ${b.board} · ${b.grade}`,
      })),
    ],
    [batches],
  )

  useEffect(() => {
    if (!batchId) {
      setBatchStudents([])
      setManualMarks({})
      return
    }

    let cancelled = false
    setLoadingStudents(true)
    void fetchStudentsForBatch(batchId)
      .then((list) => {
        if (cancelled) return
        setBatchStudents(list.map((s) => ({ id: s.id, name: s.name })))
        setManualMarks({})
        const subjects = getCurriculumSubjectsForBatch(curriculum, selectedBatch)
        setManualColumns([
          createMarksColumn({ conductedOn: todayIso(), subject: subjects[0] ?? '' }),
        ])
      })
      .catch(() => {
        if (!cancelled) setBatchStudents([])
      })
      .finally(() => {
        if (!cancelled) setLoadingStudents(false)
      })

    return () => {
      cancelled = true
    }
  }, [batchId, curriculum, selectedBatch])

  const clearUploadPreview = useCallback(() => {
    setUploadPreviewLoaded(false)
    setUploadMarks({})
    setUploadFileName(null)
    setUploadParseError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  useEffect(() => {
    if (!uploadBatchId) {
      setUploadStudents([])
      clearUploadPreview()
      return
    }

    let cancelled = false
    setLoadingUploadStudents(true)
    clearUploadPreview()
    void fetchStudentsForBatch(uploadBatchId)
      .then((list) => {
        if (cancelled) return
        setUploadStudents(list.map((s) => ({ id: s.id, name: s.name })))
        const subjects = getCurriculumSubjectsForBatch(curriculum, uploadBatch)
        setUploadColumns([
          createMarksColumn({ conductedOn: todayIso(), subject: subjects[0] ?? '' }),
        ])
      })
      .catch(() => {
        if (!cancelled) setUploadStudents([])
      })
      .finally(() => {
        if (!cancelled) setLoadingUploadStudents(false)
      })

    return () => {
      cancelled = true
    }
  }, [uploadBatchId, curriculum, uploadBatch, clearUploadPreview])

  const marksLog = useMemo(
    () =>
      [...offlineRecords].sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      ),
    [offlineRecords],
  )

  const activitySessions = useMemo(() => groupMarksBySession(marksLog), [marksLog])

  const manualCount = offlineRecords.filter((r) => r.source === 'manual').length
  const uploadCount = offlineRecords.filter((r) => r.source === 'upload').length

  const flash = useCallback((type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text })
    window.setTimeout(() => setSaveMessage(null), 5000)
  }, [])

  function buildRecordsFromGrid(
    students: { id: string; name: string }[],
    columns: MarksColumnConfig[],
    marks: MarksGrid,
    meta: {
      title: string
      description: string
      batchName: string
      source: MarksSource
    },
  ): { records: MarksRecord[]; errors: string[] } {
    const errors: string[] = []
    const records: MarksRecord[] = []
    const now = new Date().toISOString()
    const sessionId = `sess-${Date.now()}`

    if (!meta.title.trim()) errors.push('Assessment title is required.')

    for (const col of columns) {
      if (!col.subject.trim()) {
        errors.push('Each column needs a subject selected from Curriculum setup.')
        break
      }
      if (!col.conductedOn) {
        errors.push('Each column needs a date of conduction.')
        break
      }
      if (col.maxMarks <= 0) {
        errors.push(`"${col.subject || 'Column'}" needs max marks greater than 0.`)
        break
      }
    }

    if (errors.length) return { records, errors }

    for (const col of columns) {
      for (const student of students) {
        const raw = marks[col.id]?.[student.id]
        if (raw === undefined || raw === '') continue
        const scored = Number(raw)
        if (Number.isNaN(scored)) {
          errors.push(`Invalid marks for ${student.name} (${col.subject}).`)
          continue
        }
        if (scored < 0 || scored > col.maxMarks) {
          errors.push(
            `Marks for ${student.name} in ${col.subject} must be between 0 and ${col.maxMarks}.`,
          )
          continue
        }
        records.push({
          id: `off-${Date.now()}-${col.id}-${student.id}`,
          sessionId,
          studentId: student.id,
          studentName: student.name,
          batch: meta.batchName,
          assessmentTitle: meta.title.trim(),
          description: meta.description.trim() || undefined,
          subject: col.subject.trim(),
          maxMarks: col.maxMarks,
          scoredMarks: scored,
          percentage: pct(scored, col.maxMarks),
          source: meta.source,
          conductedOn: col.conductedOn,
          savedAt: now,
        })
      }
    }

    if (records.length === 0 && errors.length === 0) {
      errors.push('Enter marks for at least one student in any column.')
    }

    return { records, errors }
  }

  function patchColumn(
    setter: Dispatch<SetStateAction<MarksColumnConfig[]>>,
    columnId: string,
    patch: Partial<MarksColumnConfig>,
  ) {
    setter((cols) => cols.map((c) => (c.id === columnId ? { ...c, ...patch } : c)))
  }

  function removeColumn(
    setColumns: Dispatch<SetStateAction<MarksColumnConfig[]>>,
    setMarks: Dispatch<SetStateAction<MarksGrid>>,
    columnId: string,
  ) {
    setColumns((cols) => {
      if (cols.length <= 1) return cols
      return cols.filter((c) => c.id !== columnId)
    })
    setMarks((prev) => {
      const next = { ...prev }
      delete next[columnId]
      return next
    })
  }

  async function persistMarks(
    students: { id: string; name: string }[],
    columns: MarksColumnConfig[],
    marks: MarksGrid,
    meta: {
      title: string
      description: string
      batchId: string
      batchName: string
      source: MarksSource
    },
  ): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
    const { errors } = buildRecordsFromGrid(students, columns, marks, meta)
    if (errors.length) return { ok: false, error: errors[0] }

    if (!marksApiAvailable()) {
      return { ok: false, error: 'Marks require a connection to the Prism API.' }
    }

    try {
      const result = await saveMarksBulk({
          batchId: meta.batchId,
          assessmentTitle: meta.title,
          description: meta.description || undefined,
          source: meta.source,
          columns: columns.map((c) => ({
            id: c.id,
            subject: c.subject,
            conductedOn: c.conductedOn,
            maxMarks: c.maxMarks,
          })),
          marks,
          studentIds: students.map((s) => s.id),
        })
      await reloadMarks()
      return { ok: true, count: result.count }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Failed to save marks.' }
    }
  }

  async function handleSaveManual() {
    if (!selectedBatch) {
      flash('error', 'Select a batch first.')
      return
    }
    const result = await persistMarks(batchStudents, manualColumns, manualMarks, {
      title: manualTitle,
      description: manualDescription,
      batchId: selectedBatch.id,
      batchName: selectedBatch.name,
      source: 'manual',
    })
    if (!result.ok) {
      flash('error', result.error)
      return
    }
    setManualMarks({})
    flash('success', `Entry added · ${manualTitle.trim() || 'Untitled assessment'}`)
    setTab('recent')
  }

  function handleDownloadTemplate(format: 'csv' | 'xlsx') {
    if (!uploadBatch) {
      flash('error', 'Select a batch first.')
      return
    }
    if (uploadStudents.length === 0) {
      flash('error', 'No students in this batch.')
      return
    }
    if (uploadColumns.some((col) => !col.subject.trim())) {
      flash('error', 'Select a subject for each column before downloading the template.')
      return
    }
    if (uploadColumns.some((col) => !col.conductedOn || col.maxMarks <= 0)) {
      flash('error', 'Set date and max marks for each column before downloading.')
      return
    }

    const slug = uploadBatch.name.replace(/\s+/g, '-').toLowerCase() || 'template'
    const meta = {
      title: uploadTitle.trim() || undefined,
      batch: uploadBatch.name,
    }
    if (format === 'xlsx') {
      downloadSpreadsheetTemplateXlsx(
        uploadStudents,
        uploadColumns,
        `prism-marks-${slug}-template.xlsx`,
        meta,
      )
    } else {
      downloadSpreadsheetTemplateCsv(
        uploadStudents,
        uploadColumns,
        `prism-marks-${slug}-template.csv`,
        meta,
      )
    }
    clearUploadPreview()
    flash(
      'success',
      `${format === 'xlsx' ? 'Excel' : 'CSV'} template downloaded — fill marks and upload the file to preview here.`,
    )
  }

  async function handleFilePick(file: File | null) {
    if (!file) return
    if (!uploadBatchId) {
      flash('error', 'Select a batch first.')
      return
    }
    if (uploadStudents.length === 0) {
      flash('error', 'Load batch students before uploading.')
      return
    }

    setUploadParseError(null)

    if (!isMarksUploadFileName(file.name)) {
      clearUploadPreview()
      flash('error', 'Use .csv, .xlsx, or .xls from the template (or legacy Student ID / Name sheet).')
      return
    }

    const parsed = await parseMarksUploadFile(file)
    if (!parsed.ok) {
      clearUploadPreview()
      setUploadParseError(parsed.error)
      flash('error', parsed.error)
      return
    }

    const subjects = getCurriculumSubjectsForBatch(curriculum, uploadBatch)
    const importedColumns = parsed.columns.map((col) => {
      const subject = mapSubjectLabelToCurriculum(col.subject, subjects) || col.subject.trim()
      return createMarksColumn({
        subject,
        conductedOn: col.conductedOn,
        maxMarks: col.maxMarks,
      })
    })

    const { marks, matched, unmatched } = applyParsedSpreadsheetToGrid(
      uploadStudents,
      importedColumns,
      parsed.marksByStudentName,
    )

    if (matched === 0) {
      clearUploadPreview()
      const message = unmatched.length
        ? `No student names matched this batch. Check spelling: ${unmatched.slice(0, 3).join(', ')}${unmatched.length > 3 ? '…' : ''}.`
        : 'No marks loaded from the file.'
      setUploadParseError(message)
      flash('error', message)
      return
    }

    setUploadColumns(importedColumns)
    setUploadMarks(marks)
    setUploadFileName(file.name)
    setUploadPreviewLoaded(true)
    setUploadParseError(null)
    if (parsed.title && !uploadTitle.trim()) {
      setUploadTitle(parsed.title)
    }

    let message = `Preview loaded · ${matched} student${matched === 1 ? '' : 's'} · ${importedColumns.length} column${importedColumns.length === 1 ? '' : 's'}.`
    if (unmatched.length > 0) {
      message += ` Skipped ${unmatched.length} row${unmatched.length === 1 ? '' : 's'} not in batch.`
    }
    flash('success', message)
  }

  async function handleSaveUpload() {
    if (!uploadBatch) {
      flash('error', 'Select a batch for this upload.')
      return
    }
    if (uploadStudents.length === 0) {
      flash('error', 'Select a batch with students first.')
      return
    }

    const savedTitle = uploadTitle.trim() || 'Untitled assessment'
    const result = await persistMarks(uploadStudents, uploadColumns, uploadMarks, {
      title: uploadTitle,
      description: '',
      batchId: uploadBatch.id,
      batchName: uploadBatch.name,
      source: 'upload',
    })
    if (!result.ok) {
      flash('error', result.error)
      return
    }
    clearUploadPreview()
    setUploadTitle('')
    flash('success', `Entry added · ${savedTitle}`)
    setTab('recent')
  }

  async function handleExportAll() {
    try {
      if (marksApiAvailable()) {
        await downloadMarksExport({ format: 'xlsx', filename: 'prism-marks-export.xlsx' })
      } else if (activitySessions.length > 0) {
        exportAllMarksSessionsXlsx(activitySessions, 'prism-marks-export.xlsx')
      } else {
        flash('error', 'No saved marks to export.')
        return
      }
      flash('success', `Exported ${activitySessions.length} assessment${activitySessions.length === 1 ? '' : 's'} to one Excel file (separate sheets).`)
    } catch {
      flash('error', 'Could not export marks.')
    }
  }

  async function handleExportSession(session: MarksActivitySession) {
    const slug = session.assessmentTitle.replace(/\s+/g, '-').toLowerCase().slice(0, 40)
    try {
      if (marksApiAvailable()) {
        await downloadMarksExport({
          sessionId: session.sessionId,
          filename: `prism-marks-${slug || 'session'}.xlsx`,
          format: 'xlsx',
        })
      } else {
        exportMarksSpreadsheetFile(session.entries, `prism-marks-${slug || 'session'}.csv`, {
          assessmentTitle: session.assessmentTitle,
          batch: session.batch,
        })
      }
      flash('success', 'Session exported as Excel.')
    } catch {
      flash('error', 'Could not export this session.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Marks management"
        title="Marks"
        sub="Enter or upload offline exam marks here. Saved marks flow into Reports together with in-app assessment results. Export matches the spreadsheet layout."
      />

      {!marksApiAvailable() && (
        <p className="mb-4 rounded-md border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
          Marks require a connection to the Prism API. Set <code className="text-xs">VITE_API_BASE_URL</code>{' '}
          and ensure the backend is running — offline storage is not used.
        </p>
      )}

      {saveMessage && (
        <div
          className={cn(
            'mb-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
            saveMessage.type === 'success'
              ? 'border-leaf/30 bg-leaf/10 text-foreground'
              : 'border-rose/30 bg-rose/10 text-rose',
          )}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{saveMessage.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AppStat
          label="Recent saves"
          value={activitySessions.length}
          hint={`${offlineRecords.length} mark entries`}
        />
        <AppStat label="Manual entered" value={manualCount} hint="Spreadsheet saves" />
        <AppStat label="Uploaded" value={uploadCount} hint="From CSV files" tone="accent" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6 ln-tabs-bar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              tab === id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'recent' && (
        <AppCard>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="font-display text-lg text-foreground">Recent activity</h2>
            </div>
            {offlineRecords.length > 0 && (
              <button
                type="button"
                onClick={() => void handleExportAll()}
                className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-md text-xs hover:bg-secondary"
              >
                <Download className="w-3.5 h-3.5" />
                Export all Excel
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manual entries and CSV uploads saved to your institution. These feed Reports alongside
            assessment results.
          </p>

          {loadingMarks ? (
            <div className="rounded-lg border border-border py-10 flex justify-center">
              <InlineLoader label="Loading saved marks…" size="sm" />
            </div>
          ) : activitySessions.length === 0 ? (
            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground text-sm">
              No recent activity yet. Enter marks manually or upload a CSV file.
            </div>
          ) : (
            <div className="space-y-2">
              {activitySessions.map((session) => (
                <MarksActivityRow
                  key={session.sessionId}
                  session={session}
                  expanded={viewingSessionId === session.sessionId}
                  onToggleView={() =>
                    setViewingSessionId((id) =>
                      id === session.sessionId ? null : session.sessionId,
                    )
                  }
                  onExport={() => void handleExportSession(session)}
                />
              ))}
            </div>
          )}
        </AppCard>
      )}

      {tab === 'upload' && (
        <AppCard className="flex flex-col">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="w-full sm:w-48 shrink-0">
              <AppDropdown
                label="Batch"
                value={uploadBatchId}
                onChange={setUploadBatchId}
                options={batchOptions}
              />
            </div>
            <button
              type="button"
              disabled={!uploadBatchId || uploadStudents.length === 0}
              onClick={() => handleDownloadTemplate('csv')}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary disabled:opacity-40 h-[38px]"
            >
              <Download className="w-4 h-4" />
              CSV template
            </button>
            <button
              type="button"
              disabled={!uploadBatchId || uploadStudents.length === 0}
              onClick={() => handleDownloadTemplate('xlsx')}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary disabled:opacity-40 h-[38px]"
            >
              <Download className="w-4 h-4" />
              Excel template
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                void handleFilePick(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              disabled={!uploadBatchId || uploadStudents.length === 0}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary disabled:opacity-40 h-[38px]"
            >
              <Upload className="w-4 h-4" />
              Upload file
            </button>
            {uploadFileName && (
              <span className="text-xs text-muted-foreground pb-2 truncate max-w-[200px]">
                {uploadFileName}
              </span>
            )}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-muted-foreground mb-1">Assessment title</label>
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Required before saving"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-[38px]"
              />
            </div>
          </div>

          {uploadBatch && (
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-1 mb-4">
              <span>
                {uploadBatch.board} · {uploadBatch.grade}
              </span>
              {loadingUploadStudents ? (
                <InlineLoader label="Loading students…" size="xs" />
              ) : (
                <span>· {uploadStudents.length} students</span>
              )}
              <span>
                {uploadSubjectOptions.length > 0
                  ? `· ${uploadSubjectOptions.length} curriculum subject${uploadSubjectOptions.length === 1 ? '' : 's'}`
                  : '· No subjects in curriculum setup'}
              </span>
            </div>
          )}

          <div className="rounded-lg border border-border bg-secondary/10 p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-foreground">Subject columns for template</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Pick one or more subjects, set max marks and date, then download CSV or Excel template.
            </p>
            <MarksSpreadsheet
              students={[]}
              columns={uploadColumns}
              marks={{}}
              onColumnChange={(columnId, patch) => patchColumn(setUploadColumns, columnId, patch)}
              onAddColumn={() =>
                setUploadColumns((cols) => [
                  ...cols,
                  createMarksColumn({
                    conductedOn: todayIso(),
                    subject: pickNextSubject(cols, uploadSubjectOptions),
                  }),
                ])
              }
              onRemoveColumn={(columnId) =>
                removeColumn(setUploadColumns, setUploadMarks, columnId)
              }
              subjectOptions={uploadSubjectOptions}
              marksReadOnly
              emptyMessage="Configure subject columns above, then download the template."
            />
          </div>

          <div className="flex flex-col flex-1 min-h-[min(50vh,480px)] rounded-lg border border-border overflow-hidden bg-secondary/10">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Preview
              </span>
              {uploadPreviewLoaded && (
                <span className="text-xs text-muted-foreground">
                  {uploadFileName ? `${uploadFileName} · ` : ''}
                  {uploadStudents.length} students · {uploadColumns.length} column
                  {uploadColumns.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {uploadParseError && (
              <div className="mx-4 mt-3 rounded-md border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
                {uploadParseError}
              </div>
            )}

            <div className="flex-1 overflow-auto min-h-0">
              {uploadPreviewLoaded ? (
                <MarksSpreadsheet
                  students={uploadStudents}
                  columns={uploadColumns}
                  marks={uploadMarks}
                  readOnly
                  className="border-0 rounded-none min-h-full"
                  emptyMessage="No marks in this upload."
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[280px] px-6 text-center text-sm text-muted-foreground">
                  <Upload className="w-8 h-8 mb-3 opacity-40" />
                  <p>No preview yet.</p>
                  <p className="text-xs mt-1 max-w-md">
                    Download the CSV or Excel template, fill marks, then upload. Preview appears here
                    after a successful upload.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 shrink-0">
            <button
              type="button"
              disabled={!uploadPreviewLoaded}
              onClick={handleSaveUpload}
              className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              Save uploaded marks
            </button>
          </div>
        </AppCard>
      )}

      {tab === 'manual' && (
        <AppCard>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-5 h-5 text-accent" />
            <h2 className="font-display text-lg text-foreground">Manual entry</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Select a batch, set assessment details, then enter marks. Use <strong>Add column</strong>{' '}
            for multiple subjects in one sheet.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Assessment title</label>
              <input
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Weekly test — Fractions"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background font-medium"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Description (optional)</label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                rows={2}
                placeholder="What this assessment covers, instructions, or notes for your records…"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y"
              />
            </div>
            <AppDropdown label="Batch" value={batchId} onChange={setBatchId} options={batchOptions} />
            {selectedBatch && (
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-1">
                <span>
                  {selectedBatch.board} · {selectedBatch.grade}
                </span>
                {loadingStudents ? (
                  <InlineLoader label="Loading students…" size="xs" />
                ) : (
                  <span>· {batchStudents.length} students</span>
                )}
                <span>
                  {manualSubjectOptions.length > 0
                    ? `· ${manualSubjectOptions.length} curriculum subject${manualSubjectOptions.length === 1 ? '' : 's'}`
                    : '· No subjects in curriculum setup'}
                </span>
              </div>
            )}
          </div>

          <MarksSpreadsheet
            students={batchStudents}
            columns={manualColumns}
            marks={manualMarks}
            onMarksChange={(columnId, studentId, value) =>
              setManualMarks((prev) => ({
                ...prev,
                [columnId]: { ...prev[columnId], [studentId]: value },
              }))
            }
            onColumnChange={(columnId, patch) => patchColumn(setManualColumns, columnId, patch)}
            onAddColumn={() =>
              setManualColumns((cols) => [
                ...cols,
                createMarksColumn({
                  conductedOn: todayIso(),
                  subject: pickNextSubject(cols, manualSubjectOptions),
                }),
              ])
            }
            onRemoveColumn={(columnId) =>
              removeColumn(setManualColumns, setManualMarks, columnId)
            }
            subjectOptions={manualSubjectOptions}
          />

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleSaveManual}
              disabled={!batchId || batchStudents.length === 0}
              className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              Save marks
            </button>
            <button
              type="button"
              onClick={() => {
                setManualMarks({})
                flash('success', 'Cleared unsaved marks.')
              }}
              className="border border-border px-4 py-2 rounded-md text-sm hover:bg-secondary"
            >
              Clear entries
            </button>
          </div>
        </AppCard>
      )}
    </>
  )
}

function MarksActivityRow({
  session,
  expanded,
  onToggleView,
  onExport,
}: {
  session: MarksActivitySession
  expanded: boolean
  onToggleView: () => void
  onExport: () => void
}) {
  const spreadsheet = useMemo(() => sessionToSpreadsheet(session), [session])
  const studentCount = new Set(session.entries.map((e) => e.studentId)).size
  const columnCount = spreadsheet.columns.length

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-card hover:bg-secondary/20 transition-colors">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf/15 text-leaf">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Entry added</p>
            <h3 className="font-display text-base font-semibold text-foreground truncate">
              {session.assessmentTitle}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {session.batch}
              <span className="mx-1.5">·</span>
              {session.entries.length} mark{session.entries.length === 1 ? '' : 's'}
              <span className="mx-1.5">·</span>
              {studentCount} student{studentCount === 1 ? '' : 's'}
              {columnCount > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  {columnCount} column{columnCount === 1 ? '' : 's'}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
          <span className="text-xs text-muted-foreground whitespace-nowrap order-last sm:order-none w-full sm:w-auto">
            {formatSavedAt(session.savedAt)}
          </span>
          <SourceBadge source={session.source} />
          <button
            type="button"
            onClick={onToggleView}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium min-h-[36px]',
              expanded
                ? 'border-accent bg-accent/15 text-foreground'
                : 'border-border hover:bg-secondary/60',
            )}
          >
            {expanded ? <X className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {expanded ? 'Close' : 'View'}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary/60 min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-secondary/10 p-3 sm:p-4">
          {session.description && (
            <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
          )}
          <div className="rounded-lg border border-border overflow-hidden bg-secondary/10 min-h-[240px] max-h-[min(70vh,640px)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Saved marks
              </span>
              <span className="text-xs text-muted-foreground">
                {studentCount} students · {columnCount} column{columnCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              <MarksSpreadsheet
                students={spreadsheet.students}
                columns={spreadsheet.columns}
                marks={spreadsheet.marks}
                readOnly
                className="border-0 rounded-none min-h-full"
                emptyMessage="No marks in this session."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SourceBadge({ source }: { source: MarksSource }) {
  const config =
    source === 'manual'
      ? { icon: PenLine, label: 'Manual', className: 'bg-accent/15 text-accent' }
      : { icon: FileSpreadsheet, label: 'Upload', className: 'bg-secondary text-muted-foreground' }
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded',
        config.className,
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}