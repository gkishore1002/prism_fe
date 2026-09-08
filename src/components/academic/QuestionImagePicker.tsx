import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { AuthImage } from '@/components/ui/AuthImage'
import { uploadQuestionMedia } from '@/lib/api/questionMediaApi'
import { cn } from '@/lib/cn'

interface QuestionImagePickerProps {
  label: string
  imageKey?: string | null
  imageUrl?: string | null
  onUploaded: (key: string, url: string) => void
  onCleared: () => void
  className?: string
}

export function QuestionImagePicker({
  label,
  imageKey,
  imageUrl,
  onUploaded,
  onCleared,
  className,
}: QuestionImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const result = await uploadQuestionMedia(file)
      onUploaded(result.key, result.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {imageKey || imageUrl ? (
        <div className="relative inline-block max-w-full">
          <AuthImage
            mediaPath={imageUrl || (imageKey ? `/question-media/${imageKey}` : undefined)}
            className="max-h-36"
            alt={label}
          />
          <button
            type="button"
            onClick={onCleared}
            className="absolute top-1 right-1 rounded-full bg-card/90 border border-border p-1 text-muted-foreground hover:text-rose"
            aria-label={`Remove ${label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-dashed border-border hover:bg-secondary/40 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          {busy ? 'Uploading…' : 'Upload photo'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {error && <p className="text-[11px] text-rose">{error}</p>}
    </div>
  )
}
