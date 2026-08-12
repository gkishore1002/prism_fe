import type { UserRole } from '@/types'

/** Platform operator in public.super_admins — logs in with org code SYSTEM. */
export function isPlatformSuperUser(role: UserRole | null | undefined): boolean {
  return role === 'super_user'
}

/** Tenant organization owner (admin + is_owner in tenant schema). */
export function isOrganizationOwner(role: UserRole | null | undefined, isOwner: boolean): boolean {
  return role === 'admin' && isOwner
}

/** Any admin portal user — organization owner or branch admin. */
export function isAdminPortalUser(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'super_user'
}

/** Branch-scoped admin portal (no org-wide branch picker or Branches module). */
export function isBranchScopedAdminPortal(
  adminPortal: 'organization' | 'branch' | undefined,
  role: UserRole | null | undefined,
  canManageTenant: boolean,
): boolean {
  if (role !== 'admin') return false
  if (adminPortal === 'branch') return true
  if (adminPortal === 'organization') return false
  return !canManageTenant
}

/** Organization-wide admin portal (Branches, Settings, org owner staff controls). */
export function isOrganizationAdminPortal(
  adminPortal: 'organization' | 'branch' | undefined,
  role: UserRole | null | undefined,
  canManageTenant: boolean,
): boolean {
  if (role !== 'admin') return false
  if (adminPortal === 'organization') return true
  if (adminPortal === 'branch') return false
  return canManageTenant
}

export function adminPortalLabel(
  adminPortal: 'organization' | 'branch' | undefined,
  role: UserRole | null | undefined,
  canManageTenant: boolean,
): string {
  return isBranchScopedAdminPortal(adminPortal, role, canManageTenant)
    ? 'Branch Admin'
    : 'Organization Admin'
}

export function adminConsoleLabel(
  adminPortal: 'organization' | 'branch' | undefined,
  role: UserRole | null | undefined,
  canManageTenant: boolean,
): string {
  return isBranchScopedAdminPortal(adminPortal, role, canManageTenant)
    ? 'Branch Console'
    : 'Organization Console'
}

/** May manage tenant-wide admin settings (org owner or platform super user in org context). */
export function canManageTenant(
  role: UserRole | null | undefined,
  isOwner: boolean,
  isPlatformSuperUserInContext = false,
): boolean {
  return isOrganizationOwner(role, isOwner) || isPlatformSuperUserInContext
}

export function adminRoleLabel(role: UserRole, isOwner: boolean): string {
  if (isPlatformSuperUser(role)) return 'Platform Super User'
  if (isOrganizationOwner(role, isOwner)) return 'Organization Owner'
  if (role === 'admin') return 'Branch Admin'
  if (role === 'tutor') return 'Tutor'
  return 'Student'
}
