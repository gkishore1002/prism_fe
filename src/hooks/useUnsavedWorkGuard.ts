import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'
import {
  useConfirmModal,
  type UnsavedWorkChoice,
  type UnsavedWorkOptions,
} from '@/components/ui/AppModal'

export interface UseUnsavedWorkGuardOptions {
  isDirty: boolean
  /** Persist incomplete work to the server. Throw/reject to stay on page. */
  onDraft: () => Promise<void>
  /** Fully validate and publish. Throw/reject to stay on page. */
  onPublish: () => Promise<void>
  /** Reset form / discard. May delete server draft. */
  onCancel: () => void | Promise<void>
  modalOptions?: UnsavedWorkOptions
  /** Confirm before standalone Draft / Publish / Cancel button clicks. */
  confirmActions?: boolean
}

/**
 * Guards dirty entry forms: route leaves (useBlocker), tab switches (requestLeave),
 * and optional beforeunload. Leave modal offers Draft / Publish / Discard.
 */
export function useUnsavedWorkGuard({
  isDirty,
  onDraft,
  onPublish,
  onCancel,
  modalOptions,
  confirmActions = true,
}: UseUnsavedWorkGuardOptions) {
  const { confirm, confirmUnsavedWork } = useConfirmModal()
  const allowLeaveRef = useRef(false)
  const busyRef = useRef(false)
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const onDraftRef = useRef(onDraft)
  const onPublishRef = useRef(onPublish)
  const onCancelRef = useRef(onCancel)
  const modalOptionsRef = useRef(modalOptions)
  onDraftRef.current = onDraft
  onPublishRef.current = onPublish
  onCancelRef.current = onCancel
  modalOptionsRef.current = modalOptions

  const runChoice = useCallback(async (choice: UnsavedWorkChoice) => {
    if (choice === 'draft') {
      await onDraftRef.current()
      return
    }
    if (choice === 'publish') {
      await onPublishRef.current()
      return
    }
    await onCancelRef.current()
  }, [])

  const requestLeave = useCallback(async (): Promise<boolean> => {
    if (!isDirtyRef.current || allowLeaveRef.current) return true
    if (busyRef.current) return false
    busyRef.current = true
    try {
      const choice = await confirmUnsavedWork(modalOptionsRef.current)
      if (!choice) return false
      await runChoice(choice)
      allowLeaveRef.current = true
      return true
    } catch {
      return false
    } finally {
      busyRef.current = false
    }
  }, [confirmUnsavedWork, runChoice])

  const confirmDraft = useCallback(async (): Promise<boolean> => {
    if (confirmActions) {
      const ok = await confirm({
        title: 'Save as draft?',
        message: 'Save your work as a draft?',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      })
      if (!ok) return false
    }
    try {
      await onDraftRef.current()
      return true
    } catch {
      return false
    }
  }, [confirm, confirmActions])

  const confirmPublish = useCallback(async (): Promise<boolean> => {
    if (confirmActions) {
      const ok = await confirm({
        title: 'Publish now?',
        message: 'Publish these marks to the school?',
        confirmLabel: 'Publish',
        cancelLabel: 'Cancel',
      })
      if (!ok) return false
    }
    try {
      await onPublishRef.current()
      return true
    } catch {
      return false
    }
  }, [confirm, confirmActions])

  const confirmCancel = useCallback(async (): Promise<boolean> => {
    if (confirmActions) {
      const ok = await confirm({
        title: 'Discard draft?',
        message: 'Discard this draft? This cannot be undone.',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        variant: 'danger',
      })
      if (!ok) return false
    }
    try {
      await onCancelRef.current()
      return true
    } catch {
      return false
    }
  }, [confirm, confirmActions])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirtyRef.current &&
      !allowLeaveRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  // Keep blocker callback in sync with dirty state without remounting the effect.
  const requestLeaveRef = useRef(requestLeave)
  requestLeaveRef.current = requestLeave
  const handlingBlockRef = useRef(false)

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      handlingBlockRef.current = false
      return
    }
    if (allowLeaveRef.current) {
      blocker.proceed()
      return
    }
    if (handlingBlockRef.current) return
    handlingBlockRef.current = true
    void (async () => {
      try {
        const ok = await requestLeaveRef.current()
        if (ok) {
          allowLeaveRef.current = true
          blocker.proceed()
        } else {
          blocker.reset()
        }
      } finally {
        handlingBlockRef.current = false
      }
    })()
    // Intentionally no cleanup cancel — aborting the confirm dropped proceed() after the user chose Leave.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a new navigation is blocked
  }, [blocker.state, blocker.location?.pathname, blocker.location?.key])

  useEffect(() => {
    if (!isDirty) {
      // Only clear the leave flag when idle — not while a blocked navigation is resolving.
      if (blocker.state !== 'blocked') {
        allowLeaveRef.current = false
      }
      return
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, blocker.state])

  const markClean = useCallback(() => {
    allowLeaveRef.current = true
  }, [])

  return {
    requestLeave,
    confirmDraft,
    confirmPublish,
    confirmCancel,
    markClean,
  }
}
