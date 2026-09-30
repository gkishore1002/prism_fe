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

  const runChoice = useCallback(
    async (choice: UnsavedWorkChoice) => {
      if (choice === 'draft') {
        await onDraft()
        return
      }
      if (choice === 'publish') {
        await onPublish()
        return
      }
      await onCancel()
    },
    [onCancel, onDraft, onPublish],
  )

  const requestLeave = useCallback(async (): Promise<boolean> => {
    if (!isDirty || allowLeaveRef.current) return true
    if (busyRef.current) return false
    busyRef.current = true
    try {
      const choice = await confirmUnsavedWork(modalOptions)
      if (!choice) return false
      await runChoice(choice)
      allowLeaveRef.current = true
      return true
    } catch {
      return false
    } finally {
      busyRef.current = false
    }
  }, [confirmUnsavedWork, isDirty, modalOptions, runChoice])

  const confirmDraft = useCallback(async (): Promise<boolean> => {
    if (confirmActions) {
      const ok = await confirm({
        title: 'Save as draft?',
        message: 'Your work will be saved as a draft so you can continue later from any device.',
        confirmLabel: 'Save draft',
        cancelLabel: 'Keep editing',
      })
      if (!ok) return false
    }
    try {
      await onDraft()
      return true
    } catch {
      return false
    }
  }, [confirm, confirmActions, onDraft])

  const confirmPublish = useCallback(async (): Promise<boolean> => {
    if (confirmActions) {
      const ok = await confirm({
        title: 'Publish now?',
        message: 'This will validate and publish your work. You can still edit published content later where supported.',
        confirmLabel: 'Publish',
        cancelLabel: 'Keep editing',
      })
      if (!ok) return false
    }
    try {
      await onPublish()
      return true
    } catch {
      return false
    }
  }, [confirm, confirmActions, onPublish])

  const confirmCancel = useCallback(async (): Promise<boolean> => {
    if (confirmActions) {
      const ok = await confirm({
        title: 'Discard and reset?',
        message: 'Unsaved changes will be cleared and the form reset. Any open draft on the server will be deleted.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        variant: 'danger',
      })
      if (!ok) return false
    }
    try {
      await onCancel()
      return true
    } catch {
      return false
    }
  }, [confirm, confirmActions, onCancel])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !allowLeaveRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (allowLeaveRef.current) {
      blocker.proceed()
      return
    }
    let active = true
    void (async () => {
      const ok = await requestLeave()
      if (!active) return
      if (ok) {
        allowLeaveRef.current = true
        blocker.proceed()
      } else {
        blocker.reset()
      }
    })()
    return () => {
      active = false
    }
  }, [blocker, requestLeave])

  useEffect(() => {
    if (!isDirty) {
      allowLeaveRef.current = false
      return
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

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
