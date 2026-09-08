import { useCallback, useEffect, useRef, useState } from 'react'
import {
  claimExamSession,
  examSessionHeartbeat,
  recordExamViolation,
  type ExamViolationType,
} from '@/lib/api/assessmentsApi'
import { ApiError, isApiEnabled } from '@/lib/apiClient'
import { getExamDeviceId } from '@/lib/examDevice'
import {
  enterExamFullscreen,
  isExamFullscreen,
  isFullscreenApiAvailable,
} from '@/lib/examFullscreen'

const VIOLATION_COALESCE_MS = 2000
const HEARTBEAT_MS = 10_000

export interface UseExamProctoringOptions {
  enabled: boolean
  assessmentId: string | undefined
  onFlushAttempt: () => void | Promise<void>
  onTerminated: () => void
  onSecureLock: (locked: boolean) => void
}

export interface UseExamProctoringResult {
  deviceId: string
  sessionReady: boolean
  sessionError: string | null
  violationCount: number
  maxViolations: number
  requireFullscreen: boolean
  resumeExamFocus: () => Promise<void>
  /** Call before intentional leave / submit so exiting fullscreen is not counted as a violation. */
  disarmProctoring: () => void
}

export function useExamProctoring({
  enabled,
  assessmentId,
  onFlushAttempt,
  onTerminated,
  onSecureLock,
}: UseExamProctoringOptions): UseExamProctoringResult {
  const deviceId = useRef(getExamDeviceId()).current
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [violationCount, setViolationCount] = useState(0)
  const [maxViolations, setMaxViolations] = useState(3)
  const requireFullscreen = isFullscreenApiAvailable()

  const leftExamRef = useRef(false)
  const disarmedRef = useRef(false)
  const lastViolationAtRef = useRef(0)
  const lastViolationTypeRef = useRef<ExamViolationType | null>(null)
  const reportingRef = useRef(false)
  const terminatedRef = useRef(false)
  const lastActivityRef = useRef(Date.now())

  const onFlushAttemptRef = useRef(onFlushAttempt)
  const onTerminatedRef = useRef(onTerminated)
  const onSecureLockRef = useRef(onSecureLock)
  onFlushAttemptRef.current = onFlushAttempt
  onTerminatedRef.current = onTerminated
  onSecureLockRef.current = onSecureLock

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  const disarmProctoring = useCallback(() => {
    disarmedRef.current = true
    leftExamRef.current = false
    onSecureLockRef.current(false)
  }, [])

  const reportViolation = useCallback(
    async (type: ExamViolationType) => {
      if (
        !enabled ||
        disarmedRef.current ||
        !assessmentId ||
        !isApiEnabled() ||
        terminatedRef.current
      ) {
        return
      }
      const now = Date.now()
      const focusTypes = type === 'WINDOW_BLUR' || type === 'TAB_SWITCH'
      const lastFocus =
        lastViolationTypeRef.current === 'WINDOW_BLUR' ||
        lastViolationTypeRef.current === 'TAB_SWITCH'
      if (focusTypes && lastFocus && now - lastViolationAtRef.current < VIOLATION_COALESCE_MS) {
        if (type === 'TAB_SWITCH') lastViolationTypeRef.current = 'TAB_SWITCH'
        return
      }
      if (reportingRef.current) return
      reportingRef.current = true
      lastViolationAtRef.current = now
      lastViolationTypeRef.current = type
      try {
        const result = await recordExamViolation(assessmentId, type, deviceId)
        setViolationCount(result.violationCount)
        setMaxViolations(result.maxViolations)
        if (result.terminated) {
          terminatedRef.current = true
          onTerminatedRef.current()
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          terminatedRef.current = true
          onTerminatedRef.current()
        }
      } finally {
        reportingRef.current = false
      }
    },
    [assessmentId, deviceId, enabled],
  )

  const resumeExamFocus = useCallback(async () => {
    if (requireFullscreen && !isExamFullscreen()) {
      const ok = await enterExamFullscreen()
      if (!ok && !isExamFullscreen()) {
        leftExamRef.current = false
        if (!document.hidden) onSecureLockRef.current(false)
        return
      }
    }
    leftExamRef.current = false
    if (!document.hidden && (!requireFullscreen || isExamFullscreen())) {
      onSecureLockRef.current(false)
    }
  }, [requireFullscreen])

  // Claim session once when exam lock is active.
  useEffect(() => {
    if (!enabled || !assessmentId) {
      setSessionReady(true)
      setSessionError(null)
      return
    }
    disarmedRef.current = false
    terminatedRef.current = false
    if (!isApiEnabled()) {
      setSessionReady(true)
      setSessionError(null)
      return
    }
    let cancelled = false
    setSessionReady(false)
    setSessionError(null)
    void claimExamSession(assessmentId, deviceId)
      .then((session) => {
        if (cancelled) return
        setViolationCount(session.violationCount)
        setMaxViolations(session.maxViolations)
        setSessionReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not start exam session'
        setSessionError(
          err instanceof ApiError && err.status === 409
            ? 'Exam already active on another device.'
            : message,
        )
        setSessionReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [assessmentId, deviceId, enabled])

  // Heartbeat + activity tracking
  useEffect(() => {
    if (!enabled || !assessmentId || !sessionReady || !isApiEnabled()) return

    const onMove = () => markActivity()
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('keydown', onMove)
    window.addEventListener('click', onMove)

    const tick = () => {
      void examSessionHeartbeat(
        assessmentId,
        deviceId,
        new Date(lastActivityRef.current).toISOString(),
      ).catch(() => undefined)
    }
    tick()
    const id = window.setInterval(tick, HEARTBEAT_MS)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('keydown', onMove)
      window.removeEventListener('click', onMove)
    }
  }, [assessmentId, deviceId, enabled, markActivity, sessionReady])

  // Visibility / fullscreen / blur / keyblocks
  useEffect(() => {
    if (!enabled) {
      leftExamRef.current = false
      onSecureLockRef.current(false)
      return
    }
    if (requireFullscreen && !isExamFullscreen()) {
      onSecureLockRef.current(true)
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const onVisibility = () => {
      if (document.hidden) {
        leftExamRef.current = true
        onSecureLockRef.current(true)
        void onFlushAttemptRef.current()
        void reportViolation('TAB_SWITCH')
      }
    }
    const onFullscreen = () => {
      if (!isExamFullscreen()) {
        leftExamRef.current = true
        onSecureLockRef.current(true)
        void onFlushAttemptRef.current()
        void reportViolation('FULLSCREEN_EXIT')
        return
      }
      if (!leftExamRef.current && !document.hidden) {
        onSecureLockRef.current(false)
      }
    }
    const onBlur = () => {
      if (document.hidden) return
      leftExamRef.current = true
      onSecureLockRef.current(true)
      void onFlushAttemptRef.current()
      void reportViolation('WINDOW_BLUR')
    }
    const onFocus = () => {
      markActivity()
    }
    const preventContextMenu = (e: Event) => {
      e.preventDefault()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      markActivity()
      if (e.key === 'F12') {
        e.preventDefault()
        void reportViolation('DEVTOOLS_ATTEMPT')
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        void reportViolation('DEVTOOLS_ATTEMPT')
        return
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('fullscreenchange', onFullscreen)
    document.addEventListener('webkitfullscreenchange', onFullscreen)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('fullscreenchange', onFullscreen)
      document.removeEventListener('webkitfullscreenchange', onFullscreen)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [enabled, markActivity, reportViolation, requireFullscreen])

  return {
    deviceId,
    sessionReady,
    sessionError,
    violationCount,
    maxViolations,
    requireFullscreen,
    resumeExamFocus,
    disarmProctoring,
  }
}
