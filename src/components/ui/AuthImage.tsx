import { useEffect, useState } from 'react'
import { apiFetchBlob } from '@/lib/apiClient'
import { cn } from '@/lib/cn'

/** Loads auth-protected question media into an object URL for <img>. */
export function AuthImage({
  mediaPath,
  alt,
  className,
}: {
  /** API path like `/question-media/{institution}/{file}` */
  mediaPath: string | null | undefined
  alt?: string
  className?: string
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!mediaPath) {
      setSrc(null)
      return
    }
    let revoked = false
    let objectUrl: string | undefined
    setFailed(false)
    void apiFetchBlob(mediaPath)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (!revoked) setSrc(objectUrl)
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
  }, [mediaPath])

  if (!mediaPath) return null
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
