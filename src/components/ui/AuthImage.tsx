import { useEffect, useState } from 'react'
import { apiFetchBlob } from '@/lib/apiClient'
import { cn } from '@/lib/cn'
import { toQuestionMediaFetchPath } from '@/lib/questionMedia'

/** Loads auth-protected question media into an object URL for <img>. */
export function AuthImage({
  mediaPath,
  mediaKey,
  alt,
  className,
}: {
  /** API path like `/question-media/{institution}/{file}` or a stored media key. */
  mediaPath?: string | null
  mediaKey?: string | null
  alt?: string
  className?: string
}) {
  const resolvedPath = toQuestionMediaFetchPath(mediaPath, mediaKey)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!resolvedPath) {
      setSrc(null)
      setFailed(false)
      return
    }
    let revoked = false
    let objectUrl: string | undefined
    setFailed(false)
    setSrc(null)
    void apiFetchBlob(resolvedPath)
      .then((blob) => {
        if (revoked) return
        if (blob.type.includes('json') || blob.type.includes('text/html')) {
          setFailed(true)
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!revoked) {
          setFailed(true)
          setSrc(null)
        }
      })
    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [resolvedPath])

  if (!resolvedPath) return null
  if (failed) {
    return (
      <span className="text-xs text-muted-foreground italic">Image unavailable</span>
    )
  }
  if (!src) {
    return (
      <span className="block h-24 w-full max-w-md rounded-md bg-secondary/40 animate-pulse" />
    )
  }
  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={cn('max-w-full h-auto rounded-md border border-border bg-white', className)}
    />
  )
}
