import { useState } from 'react'
import { PageLoader } from '@/components/ui/PrismLoader'
import { ChevronRight, ChevronDown, BookOpen, Layers, Hash } from 'lucide-react'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { useCurriculum } from '@/hooks/useCurriculum'
import { cn } from '@/lib/cn'

function HierarchyNode({
  label,
  meta,
  icon: Icon,
  children,
  defaultOpen = false,
  level = 0,
}: {
  label: string
  meta?: string
  icon: React.ComponentType<{ className?: string }>
  children?: React.ReactNode
  defaultOpen?: boolean
  level?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasChildren = !!children

  return (
    <div className={cn(level > 0 && 'ml-5 border-l border-border pl-4')}>
      <button
        type="button"
        onClick={() => hasChildren && setOpen(!open)}
        className={cn(
          'flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg transition-colors',
          hasChildren ? 'hover:bg-secondary/60 cursor-pointer' : 'cursor-default',
        )}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <Icon className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-foreground">{label}</span>
        {meta && (
          <Badge variant="neutral" className="ml-auto">
            {meta}
          </Badge>
        )}
      </button>
      {open && children}
    </div>
  )
}

export function AdminHierarchyPage() {
  const { curriculum, loading } = useCurriculum()

  if (loading) {
    return <PageLoader />
  }

  return (
    <>
      <PageHeader
        eyebrow="Structure"
        title="Academic hierarchy"
        sub="Board → Grade → Subject → Chapter → Topic → Question"
      />

      <AppCard className="accent-blue">
        <h3 className="font-display text-[15px] font-semibold text-foreground">Content tree</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5 mb-4">
          All analytics and intelligence are built on this hierarchy
        </p>

        {curriculum.length === 0 ? (
          <p className="text-sm text-muted-foreground">No curriculum configured yet.</p>
        ) : (
          <div className="space-y-1">
            {curriculum.map((board) => (
              <HierarchyNode key={board.board} label={board.board} meta={board.board} icon={BookOpen} defaultOpen>
                {board.grades.map((grade) => (
                  <HierarchyNode key={grade.grade} label={grade.grade} icon={Layers} defaultOpen>
                    {grade.subjects.map((subject) => (
                      <HierarchyNode key={subject.name} label={subject.name} icon={BookOpen}>
                        {subject.topics.map((topic) => (
                          <HierarchyNode
                            key={topic.name}
                            label={topic.name}
                            meta={`${topic.mastery}% mastery · ${topic.questions} Q`}
                            icon={Hash}
                          />
                        ))}
                      </HierarchyNode>
                    ))}
                  </HierarchyNode>
                ))}
              </HierarchyNode>
            ))}
          </div>
        )}
      </AppCard>
    </>
  )
}