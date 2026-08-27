/** Fullscreen helpers for locked exam sessions. */

function doc(): Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
} {
  return document
}

export function isExamFullscreen(): boolean {
  const d = doc()
  return Boolean(d.fullscreenElement || d.webkitFullscreenElement)
}

export function isFullscreenApiAvailable(): boolean {
  const d = document as Document & { webkitFullscreenEnabled?: boolean }
  if (d.fullscreenEnabled === false && !d.webkitFullscreenEnabled) return false
  const el = document.documentElement as HTMLElement & {
    requestFullscreen?: () => Promise<void>
    webkitRequestFullscreen?: () => Promise<void> | void
  }
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen)
}

export async function enterExamFullscreen(
  el: HTMLElement = document.documentElement,
): Promise<boolean> {
  if (isExamFullscreen()) return true
  const node = el as HTMLElement & {
    requestFullscreen?: () => Promise<void>
    webkitRequestFullscreen?: () => Promise<void> | void
  }
  try {
    if (node.requestFullscreen) {
      await node.requestFullscreen()
      return true
    }
    if (node.webkitRequestFullscreen) {
      await node.webkitRequestFullscreen()
      return isExamFullscreen()
    }
  } catch {
    return false
  }
  return false
}

export async function exitExamFullscreen(): Promise<void> {
  if (!isExamFullscreen()) return
  const d = doc()
  try {
    if (d.exitFullscreen) await d.exitFullscreen()
    else if (d.webkitExitFullscreen) await d.webkitExitFullscreen()
  } catch {
    /* ignore denied / already exited */
  }
}

export function studentExamPath(assessmentId: string): string {
  return `/student/assessments/${assessmentId}/take`
}

/** Request fullscreen on a user gesture, then open the exam. */
export async function beginStudentExam(
  navigate: (to: string) => void,
  assessmentId: string,
): Promise<void> {
  await enterExamFullscreen()
  navigate(studentExamPath(assessmentId))
}
