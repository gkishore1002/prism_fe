import { useAuth } from '@/hooks/useAuth'
import { useCenters } from '@/hooks/useCenters'
import {
  adminConsoleLabel,
  adminPortalLabel,
  isBranchScopedAdminPortal,
  isOrganizationAdminPortal,
} from '@/lib/roles'

export function useAdminPortalContext() {
  const { adminPortal, role } = useAuth()
  const { canManageTenant } = useCenters()

  const branchScoped = isBranchScopedAdminPortal(adminPortal, role, canManageTenant)
  const organizationScoped = isOrganizationAdminPortal(adminPortal, role, canManageTenant)

  return {
    adminPortal,
    branchScoped,
    organizationScoped,
    portalLabel: adminConsoleLabel(adminPortal, role, canManageTenant),
    roleLabel: adminPortalLabel(adminPortal, role, canManageTenant),
  }
}
