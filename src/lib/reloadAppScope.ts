/** Persist scope change then hard-refresh so all providers reload cleanly. */
export function reloadAppAfterScopeChange(): void {
  window.location.reload()
}
