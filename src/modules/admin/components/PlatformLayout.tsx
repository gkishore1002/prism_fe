import { Outlet } from 'react-router-dom'

/** Platform pages use sidebar nav only — no in-page tab bar. */
export function PlatformLayout() {
  return <Outlet />
}
