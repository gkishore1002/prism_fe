import { Outlet } from 'react-router-dom'

/** Root layout — stable outlet without route flash overlays. */
export function RouterRoot() {
  return <Outlet />
}
