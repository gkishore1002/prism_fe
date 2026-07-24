import { Settings, Bell, Shield, Palette, Database } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const settingsSections = [
  { icon: Bell, title: 'Notifications', description: 'Configure alert thresholds and delivery channels', accent: 'accent-yellow' },
  { icon: Shield, title: 'Permissions', description: 'Role-based access control for tutors and admins', accent: 'accent-blue' },
  { icon: Palette, title: 'Branding', description: 'Institution logo, colors, and white-label settings', accent: 'accent-yellow' },
  { icon: Database, title: 'Data & integrations', description: 'API keys, webhooks, and third-party connections', accent: 'accent-indigo' },
]

export function AdminSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" sub="Configure your Prism institution" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {settingsSections.map(({ icon: Icon, title, description, accent }) => (
          <AppCard key={title} className={`${accent} card-hover cursor-pointer`}>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-secondary text-ink">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
                <Button variant="ghost" size="sm" className="mt-3 px-0">
                  Configure →
                </Button>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      <AppCard>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-secondary">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-[15px] font-semibold text-foreground">Platform info</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <Badge variant="neutral">v1.0.0</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment</span>
            <Badge variant="brand">Development</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Design system</span>
            <span className="font-mono-data text-foreground">Prism v2</span>
          </div>
        </div>
      </AppCard>
    </>
  )
}