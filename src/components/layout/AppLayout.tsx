import { AppShell } from './AppShell'

interface AppLayoutProps {
  module?: 'student' | 'tutor' | 'admin'
}

/** Post-login layout — matches prism AppShell structure */
export function AppLayout({ module }: AppLayoutProps) {
  return <AppShell module={module} />
}