const ACTIVE_ORG_KEY = 'prism_active_org_code'

/** Swotify-style platform context — no tenant selected (super user entry point). */
export const PLATFORM_ORG_CODE = 'SYSTEM'

export function readActiveOrgCode(): string | null {
  const code = sessionStorage.getItem(ACTIVE_ORG_KEY)
  return code && code.trim().length > 0 ? code.trim().toUpperCase() : null
}

export function isPlatformContext(): boolean {
  const code = readActiveOrgCode()
  return !code || code === PLATFORM_ORG_CODE
}

export function persistActiveOrgCode(code: string) {
  const normalized = code.trim().toUpperCase()
  if (normalized === PLATFORM_ORG_CODE) {
    clearActiveOrgCode()
    return
  }
  sessionStorage.setItem(ACTIVE_ORG_KEY, normalized)
}

export function clearActiveOrgCode() {
  sessionStorage.removeItem(ACTIVE_ORG_KEY)
}

export function enterOrganization(code: string) {
  persistActiveOrgCode(code)
}

export function enterPlatformOverview() {
  clearActiveOrgCode()
}
