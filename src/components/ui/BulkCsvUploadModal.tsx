import { useMemo, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { AppModal } from '@/components/ui/AppModal'
import { btnClass } from '@/components/ui/Button'
import { parseSpreadsheetFile } from '@/lib/csvParse'

export interface BulkCsvUploadModalProps<T> {
  open: boolean
  onClose: () => void
  title: string
  description: string
  columnsHelp: string[]
  mapRows: (rows: Record<string, string>[]) => T[]
  validateRow?: (row: T, index: number) => string | null
  previewRow: (row: T) => string
  onImport: (rows: T[]) => Promise<{ created: number; failed: number; results: { row: number; name: string; success: boolean; error?: string }[] }>
  onComplete: () => void
  onDownloadTemplate: () => Promise<void>
}

export function BulkCsvUploadModal<T>({
  open,
  onClose,
  title,
  description,
  columnsHelp,
  mapRows,
  validateRow,
  previewRow,
  onImport,
  onComplete,
  onDownloadTemplate,
}: BulkCsvUploadModalProps<T>) {
  const [parsedRows, setParsedRows] = useState<T[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number; results: { row: number; name: string; success: boolean; error?: string }[] } | null>(null)

  const validationErrors = useMemo(() => {
    if (!validateRow) return []
    return parsedRows
      .map((row, index) => {
        const message = validateRow(row, index)
        return message ? { index: index + 1, message } : null
      })
      .filter(Boolean) as { index: number; message: string }[]
  }, [parsedRows, validateRow])

  function resetState() {
    setParsedRows([])
    setParseError(null)
    setImportError(null)
    setResult(null)
  }

  function handleClose() {
    resetState()
    onClose()
  }

  async function handleFileChange(file: File | null) {
    if (!file) return
    setParseError(null)
    setResult(null)
    try {
      const parsed = await parseSpreadsheetFile(file)
      if (parsed.rows.length === 0) {
        setParsedRows([])
        setParseError('File is empty or missing data rows. Use the template headers (name, phone, …).')
        return
      }
      setParsedRows(mapRows(parsed.rows))
    } catch (error) {
      setParsedRows([])
      setParseError(error instanceof Error ? error.message : 'Could not read this file')
    }
  }

  async function handleImport() {
    if (parsedRows.length === 0) return
    setImporting(true)
    setImportError(null)
    try {
      const importResult = await onImport(parsedRows)
      setResult(importResult)
      if (importResult.created > 0) {
        onComplete()
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button type="button" onClick={handleClose} className="text-sm px-4 py-2 text-muted-foreground hover:text-foreground">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              disabled={importing || parsedRows.length === 0 || validationErrors.length > 0}
              onClick={() => void handleImport()}
              className={`${btnClass.primary} text-sm px-4 py-2 disabled:opacity-60`}
            >
              {importing ? 'Importing…' : `Import ${parsedRows.length} row${parsedRows.length === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-secondary/20 px-4 py-3 text-sm">
          <p className="font-medium text-foreground mb-2">Spreadsheet columns</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {columnsHelp.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button
            type="button"
            disabled={downloading}
            onClick={() => {
              setDownloading(true)
              void onDownloadTemplate().finally(() => setDownloading(false))
            }}
            className="mt-3 inline-flex items-center gap-2 text-sm text-accent hover:underline disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading…' : 'Download template CSV'}
          </button>
        </div>

        {!result && (
          <label className="block rounded-xl border border-dashed border-border px-4 py-8 text-center cursor-pointer hover:bg-secondary/30 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <span className="block text-sm font-medium">Upload CSV or Excel file</span>
            <span className="block text-xs text-muted-foreground mt-1">
              .csv, .xlsx, or .xls — use the template headers
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {parseError && (
          <div className="rounded-lg border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-rose">{parseError}</div>
        )}
        {importError && (
          <div className="rounded-lg border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-rose">{importError}</div>
        )}

        {validationErrors.length > 0 && (
          <div className="rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-sm">
            <p className="font-medium mb-1">Fix these rows before importing:</p>
            <ul className="space-y-1 text-muted-foreground">
              {validationErrors.slice(0, 8).map((item) => (
                <li key={item.index}>
                  Row {item.index}: {item.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsedRows.length > 0 && !result && (
          <div>
            <p className="text-sm font-medium mb-2">Preview ({parsedRows.length} rows)</p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border text-sm">
              {parsedRows.slice(0, 12).map((row, index) => (
                <div key={index} className="px-3 py-2 text-muted-foreground">
                  {previewRow(row)}
                </div>
              ))}
              {parsedRows.length > 12 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">…and {parsedRows.length - 12} more</div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                Imported {result.created} · Failed {result.failed}
              </p>
            </div>
            {result.results.some((row) => !row.success) && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border text-sm">
                {result.results
                  .filter((row) => !row.success)
                  .map((row) => (
                    <div key={row.row} className="px-3 py-2">
                      <span className="font-medium text-foreground">
                        Row {row.row}: {row.name}
                      </span>
                      <span className="block text-rose text-xs mt-0.5">{row.error}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppModal>
  )
}
