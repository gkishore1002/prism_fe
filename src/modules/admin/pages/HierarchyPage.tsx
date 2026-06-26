import { useState } from 'react'
import { ChevronRight, ChevronDown, BookOpen, Layers, FileText, Hash } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { boards, grades, subjects, chapters, topics } from '@/data/mock'
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
    <div className={cn(level > 0 && 'ml-5 border-l border-zinc-200 pl-4')}>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className={cn(
          'flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg transition-colors',
          hasChildren ? 'hover:bg-zinc-50 cursor-pointer' : 'cursor-default',
        )}
      >
        {hasChildren ? (
          open ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <span className="w-3.5" />
        )}
        <Icon className="w-4 h-4 text-brand-500 shrink-0" />
        <span className="text-sm font-medium text-zinc-900">{label}</span>
        {meta && <Badge variant="neutral" className="ml-auto">{meta}</Badge>}
      </button>
      {open && children}
    </div>
  )
}

export function AdminHierarchyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Academic Hierarchy</h2>
        <p className="text-sm text-zinc-500">
          Board → Grade → Subject → Chapter → Topic → Question
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Tree</CardTitle>
          <CardDescription>All analytics and intelligence are built on this hierarchy</CardDescription>
        </CardHeader>

        <div className="space-y-1">
          {boards.map((board) => (
            <HierarchyNode key={board.id} label={board.name} meta={board.code} icon={BookOpen} defaultOpen>
              {grades
                .filter((g) => g.boardId === board.id)
                .map((grade) => (
                  <HierarchyNode key={grade.id} label={grade.name} icon={Layers} defaultOpen>
                    {subjects
                      .filter((s) => s.gradeId === grade.id)
                      .map((subject) => (
                        <HierarchyNode key={subject.id} label={subject.name} icon={BookOpen}>
                          {chapters
                            .filter((c) => c.subjectId === subject.id)
                            .map((chapter) => (
                              <HierarchyNode key={chapter.id} label={chapter.name} icon={FileText}>
                                {topics
                                  .filter((t) => t.chapterId === chapter.id)
                                  .map((topic) => (
                                    <HierarchyNode
                                      key={topic.id}
                                      label={topic.name}
                                      meta={`${(topic.weight * 100).toFixed(0)}% weight`}
                                      icon={Hash}
                                    />
                                  ))}
                              </HierarchyNode>
                            ))}
                        </HierarchyNode>
                      ))}
                  </HierarchyNode>
                ))}
            </HierarchyNode>
          ))}
        </div>
      </Card>
    </div>
  )
}
