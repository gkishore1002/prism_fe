import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { institution, boards, grades, subjects } from '@/data/mock'
import { Users, GraduationCap, MapPin } from 'lucide-react'

export function AdminInstitutionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Institution Profile</h2>
        <p className="text-sm text-zinc-500">Organization overview and operational metrics</p>
      </div>

      <Card className="border-brand-200/60">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl gradient-brand-icon flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-brand-900">L+</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900">{institution.name}</h3>
            <p className="text-sm text-zinc-500 capitalize mt-0.5">{institution.type} center</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <MapPin className="w-3 h-3" /> Mumbai, Maharashtra
            </div>
          </div>
          <Badge variant="brand">Active</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100">
          <div className="text-center p-3 rounded-lg bg-zinc-50">
            <Users className="w-4 h-4 text-brand-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-zinc-900">{institution.studentCount}</p>
            <p className="text-xs text-zinc-500">Students</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-50">
            <GraduationCap className="w-4 h-4 text-brand-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-zinc-900">{institution.tutorCount}</p>
            <p className="text-xs text-zinc-500">Tutors</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-50">
            <p className="text-2xl font-bold text-zinc-900">{boards.length}</p>
            <p className="text-xs text-zinc-500">Boards</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-50">
            <p className="text-2xl font-bold text-zinc-900">{grades.length}</p>
            <p className="text-xs text-zinc-500">Grades</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Active Boards</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {boards.map((board) => (
              <div key={board.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                <span className="font-medium text-zinc-900">{board.name}</span>
                <Badge variant="neutral">{board.code}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Levels</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {grades.map((grade) => (
              <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50">
                <span className="font-medium text-zinc-900">{grade.name}</span>
                <span className="text-xs text-zinc-500">{subjects.filter((s) => s.gradeId === grade.id).length} subjects</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
