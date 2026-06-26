import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { StudentTopBar } from './StudentTopBar'
import { studentNav, studentMeta } from '../lib/nav'
import { cn } from '@/lib/cn'

export function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen gradient-mesh">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        nav={studentNav}
        portalLabel={studentMeta.portalLabel}
      />
      <StudentTopBar collapsed={collapsed} />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-200',
          collapsed ? 'pl-[68px]' : 'pl-[260px]',
        )}
      >
        <div className="px-5 sm:px-7 py-6 max-w-xl mx-auto animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
