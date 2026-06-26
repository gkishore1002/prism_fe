import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ChevronRight, User, FileText } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { PageHeader, AppCard } from '@/components/layout/AppShell'
import { curriculum, subjectStudents, subjectAiReport } from '@/data/ownerMock'

export function AdminSubjectReportsPage() {
  const [board, setBoard] = useState(curriculum[0].board)
  const boardData = curriculum.find((b) => b.board === board)!
  const [grade, setGrade] = useState(boardData.grades[0].grade)
  const gradeData = boardData.grades.find((g) => g.grade === grade) ?? boardData.grades[0]
  const [subject, setSubject] = useState(gradeData.subjects[0].name)
  const subjectData = gradeData.subjects.find((s) => s.name === subject) ?? gradeData.subjects[0]
  const [drillTopic, setDrillTopic] = useState<string | null>(null)
  const [drillStudent, setDrillStudent] = useState<string | null>(null)

  const grades = boardData.grades
  const subjects = gradeData.subjects
  const ai = subjectAiReport[subject] ?? subjectAiReport.Mathematics

  const sortedStudents = useMemo(
    () => [...subjectStudents].sort((a, b) => b.overall - a.overall),
    [],
  )

  function topicScore(studentName: string, overall: number, topicName: string, baseMastery: number) {
    let h = 0
    const key = studentName + topicName
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
    const jitter = ((h % 25) + 25) % 25 - 12
    const blended = Math.round(overall * 0.55 + baseMastery * 0.45 + jitter)
    return Math.max(18, Math.min(98, blended))
  }

  function studentTopicMap(studentName: string, overall: number) {
    return subjectData.topics.map((t) => ({
      name: t.name,
      mastery: topicScore(studentName, overall, t.name, t.mastery),
    }))
  }

  return (
    <>
      <PageHeader
        eyebrow="Reports · Drill-down"
        title="Subject performance reports"
        sub="Start at subject level, drill into a topic, then into individual students. AI summary at every level."
        actions={
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
        }
      />

      <AppCard className="mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Board</div>
            <div className="flex flex-wrap gap-1.5">
              {curriculum.map((b) => (
                <button
                  key={b.board}
                  type="button"
                  onClick={() => {
                    setBoard(b.board)
                    setGrade(b.grades[0].grade)
                    setSubject(b.grades[0].subjects[0].name)
                    setDrillTopic(null)
                    setDrillStudent(null)
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs ${
                    board === b.board ? 'bg-ink text-paper' : 'bg-secondary hover:bg-secondary/70'
                  }`}
                >
                  {b.board}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Grade</div>
            <div className="flex flex-wrap gap-1.5">
              {grades.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => {
                    setGrade(g.grade)
                    setSubject(g.subjects[0].name)
                    setDrillTopic(null)
                    setDrillStudent(null)
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs ${
                    grade === g.grade ? 'bg-ink text-paper' : 'bg-secondary hover:bg-secondary/70'
                  }`}
                >
                  {g.grade}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Subject</div>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setSubject(s.name)
                    setDrillTopic(null)
                    setDrillStudent(null)
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs ${
                    subject === s.name ? 'bg-ink text-paper' : 'bg-secondary hover:bg-secondary/70'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <span>{board}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{grade}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{subject}</span>
          {drillTopic && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-accent">{drillTopic}</span>
            </>
          )}
          {drillStudent && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-accent">{drillStudent}</span>
            </>
          )}
        </div>
      </AppCard>

      <AppCard className="mb-6 bg-ink text-paper">
        <div className="flex items-center gap-2 text-accent text-[10px] uppercase tracking-[0.25em]">
          <Sparkles className="w-3.5 h-3.5" /> AI Subject Report
        </div>
        <div className="font-display text-2xl mt-3">{ai.headline}</div>
        <p className="text-paper/70 mt-2 max-w-3xl text-sm">{ai.insight}</p>
        <ul className="mt-4 space-y-1.5">
          {ai.actions.map((a, i) => (
            <li key={a} className="flex gap-3 text-paper/90 text-sm">
              <span className="font-mono-data text-accent">{i + 1}.</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </AppCard>

      <AppCard className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-display text-2xl">{subject} · topic mastery</div>
          <span className="text-xs text-muted-foreground">Click a bar to drill into a topic</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={subjectData.topics}
              onClick={(state) => {
                const payload = state as { activePayload?: { payload: { name: string } }[] }
                const name = payload?.activePayload?.[0]?.payload?.name
                if (name) {
                  setDrillTopic(name)
                  setDrillStudent(null)
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="mastery" fill="var(--color-accent)" radius={[4, 4, 0, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {subjectData.topics.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => {
                setDrillTopic(t.name)
                setDrillStudent(null)
              }}
              className={`px-3 py-1 rounded-md text-xs border ${
                drillTopic === t.name
                  ? 'bg-accent text-paper border-accent'
                  : 'border-border hover:bg-secondary'
              }`}
            >
              {t.name} · {t.mastery}%
            </button>
          ))}
        </div>
      </AppCard>

      {drillTopic && (
        <AppCard className="mb-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-accent">Topic drill-down</div>
              <div className="font-display text-2xl mt-1">{drillTopic} · per student</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDrillTopic(null)
                setDrillStudent(null)
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close drill ×
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2">Student</th>
                  <th className="text-left">Roll</th>
                  <th className="text-left">Center</th>
                  <th className="text-right">Overall</th>
                  <th className="text-right">This topic</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((s) => {
                  const baseMastery =
                    subjectData.topics.find((t) => t.name === drillTopic)?.mastery ?? 60
                  const score = topicScore(s.name, s.overall, drillTopic, baseMastery)
                  return (
                    <tr key={s.roll} className="border-b border-border/60">
                      <td className="py-2.5 font-medium">{s.name}</td>
                      <td className="text-muted-foreground font-mono-data">{s.roll}</td>
                      <td className="text-muted-foreground">{s.center}</td>
                      <td className="text-right font-mono-data">{s.overall}%</td>
                      <td className="text-right font-mono-data">
                        <span
                          className={
                            score >= 75 ? 'text-leaf' : score >= 55 ? '' : 'text-rose'
                          }
                        >
                          {score}%
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setDrillStudent(s.name)}
                          className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <User className="w-3 h-3" /> Open
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </AppCard>
      )}

      {drillStudent &&
        (() => {
          const s = subjectStudents.find((x) => x.name === drillStudent)!
          const data = studentTopicMap(s.name, s.overall)
          const weakest = [...data].sort((a, b) => a.mastery - b.mastery)[0]
          return (
            <AppCard>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-accent">
                    Student drill-down
                  </div>
                  <div className="font-display text-2xl mt-1">
                    {s.name} · {subject} topic-wise
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.roll} · {s.center} · overall {s.overall}%
                  </div>
                </div>
                <Link to="/student/reports" className="text-xs text-accent hover:underline">
                  Open student profile →
                </Link>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} fontSize={11} />
                    <YAxis type="category" dataKey="name" width={150} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="mastery" fill="var(--color-leaf)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-secondary/50 rounded-md text-sm">
                <span className="text-[10px] uppercase tracking-widest text-accent">AI note</span>
                <div className="mt-1">
                  {s.name}&apos;s weakest area in {subject} is{' '}
                  <span className="font-medium">{weakest.name}</span> at {weakest.mastery}%.
                  Recommend a 9-day adaptive plan focused on this topic — expected mastery lift +14%
                  based on cohort baseline.
                </div>
              </div>
            </AppCard>
          )
        })()}
    </>
  )
}
