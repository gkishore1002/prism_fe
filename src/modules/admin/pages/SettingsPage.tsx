import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Settings, Bell, Shield, Palette, Database } from 'lucide-react'

const settingsSections = [
  { icon: Bell, title: 'Notifications', description: 'Configure alert thresholds and delivery channels' },
  { icon: Shield, title: 'Permissions', description: 'Role-based access control for tutors and admins' },
  { icon: Palette, title: 'Branding', description: 'Institution logo, colors, and white-label settings' },
  { icon: Database, title: 'Data & Integrations', description: 'API keys, webhooks, and third-party connections' },
]

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Settings</h2>
        <p className="text-sm text-zinc-500">Configure your Learnova institution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map(({ icon: Icon, title, description }) => (
          <Card key={title} hover>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">{title}</h3>
                <p className="text-xs text-zinc-500 mt-1">{description}</p>
                <Button variant="ghost" size="sm" className="mt-3 px-0">Configure →</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Platform Info
          </CardTitle>
        </CardHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Version</span>
            <Badge variant="neutral">v1.0.0</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Environment</span>
            <Badge variant="success">Production</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Academic Hierarchy</span>
            <span className="text-zinc-900 font-medium">6 levels active</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
