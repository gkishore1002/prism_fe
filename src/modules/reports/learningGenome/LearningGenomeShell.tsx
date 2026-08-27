import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { useReportLabels } from '@/lib/useReportLabels'
import { R } from '@/lib/reportLabels'
import type { ReportLabelKey } from '@/lib/reportLabels'
import {
  LgReportToolbar,
  type LgReportNavLink,
} from '@/modules/reports/learningGenome/LgReportToolbar'
import {
  ReportLanguageBar,
  ReportLanguageProvider,
} from '@/components/reports/ReportLanguageToggle'
import '@/modules/tutor/styles/learningGenome.css'

export type LgNavLinksInput =
  | LgReportNavLink[]
  | ((labels: Record<ReportLabelKey, string>) => LgReportNavLink[])

function resolveNavLinks(
  navLinks: LgNavLinksInput | undefined,
  L: Record<ReportLabelKey, string>,
): LgReportNavLink[] | undefined {
  if (!navLinks) return undefined
  return typeof navLinks === 'function' ? navLinks(L) : navLinks
}

function LgReportShell({
  children,
  toolbar,
  printTitle,
  navLinks,
  backHref,
  backLabel,
  exportLabel,
  showExport,
  bilingual,
}: {
  children: ReactNode
  toolbar?: boolean
  printTitle?: string
  navLinks?: LgReportNavLink[]
  backHref?: string
  backLabel?: string
  exportLabel?: string
  showExport?: boolean
  bilingual?: boolean
}) {
  const shell = (
    <>
      {toolbar !== false && (
        <LgReportToolbar
          printTitle={printTitle}
          links={navLinks}
          backHref={backHref}
          backLabel={backLabel}
          exportLabel={exportLabel}
          showExport={showExport}
          bilingual={bilingual}
        />
      )}
      <div
        id="lg-report-print-root"
        className="lg-report -mx-2 sm:-mx-4 rounded-xl border border-[var(--lg-line)] shadow-sm print:mx-0 print:rounded-none print:border-0 print:shadow-none"
        data-active-lang="en"
      >
        {bilingual && <ReportLanguageBar />}
        {children}
      </div>
    </>
  )
  return <div className="lg-report-shell">{shell}</div>
}

function LgReportShellLocalized({
  navLinks,
  ...props
}: Omit<Parameters<typeof LgReportShell>[0], 'navLinks'> & {
  navLinks?: LgNavLinksInput
}) {
  const { L } = useReportLabels()
  return <LgReportShell navLinks={resolveNavLinks(navLinks, L)} {...props} />
}

export function LgReportLayout({
  children,
  toolbar,
  printTitle,
  navLinks,
  backHref,
  backLabel,
  exportLabel = 'Export PDF',
  showExport = true,
  bilingual = false,
}: {
  children: ReactNode
  toolbar?: boolean
  printTitle?: string
  navLinks?: LgNavLinksInput
  backHref?: string
  backLabel?: string
  exportLabel?: string
  showExport?: boolean
  bilingual?: boolean
}) {
  if (bilingual) {
    return (
      <ReportLanguageProvider>
        <LgReportShellLocalized
          toolbar={toolbar}
          printTitle={printTitle}
          navLinks={navLinks}
          backHref={backHref}
          backLabel={backLabel}
          exportLabel={exportLabel}
          showExport={showExport}
          bilingual
        >
          {children}
        </LgReportShellLocalized>
      </ReportLanguageProvider>
    )
  }

  const staticLinks = Array.isArray(navLinks) ? navLinks : undefined
  return (
    <LgReportShell
      toolbar={toolbar}
      printTitle={printTitle}
      navLinks={staticLinks}
      backHref={backHref}
      backLabel={backLabel}
      exportLabel={exportLabel}
      showExport={showExport}
      bilingual={false}
    >
      {children}
    </LgReportShell>
  )
}

function HeroBrandMark() {
  const letter = APP_NAME.charAt(0).toUpperCase()
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--lg-gold)] font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--lg-gold-bright)]"
      aria-hidden
    >
      {letter}
    </div>
  )
}

function HeroSeal() {
  return (
    <svg className="lg-hero-seal" viewBox="0 0 52 52" aria-hidden>
      <polygon
        points="26,3 48,19 40,46 12,46 4,19"
        fill="none"
        stroke="rgba(240,215,138,0.85)"
        strokeWidth="1.5"
      />
      <polygon points="26,30 32,42 20,42" fill="var(--lg-gold)" />
    </svg>
  )
}

export function LgHero({
  reportKind,
  title,
  titleEmphasis,
  description,
  quickFacts,
  detailLines,
  meta,
  stats,
  statsPlacement = 'inside',
  showSeal = false,
  backHref,
  backLabel,
}: {
  reportKind: string
  title: ReactNode
  titleEmphasis?: ReactNode
  description?: string
  /** Uppercase fact line under the title (e.g. RANK · ATTENDANCE · RISK). */
  quickFacts?: string
  /** Mono detail lines at the bottom of the navy hero. */
  detailLines?: string[]
  meta?: { label: string; value: string }[]
  stats?: { value: string | number; unit?: string; label: string }[]
  /** `below` matches the Priya PDF white KPI strip under the gold border. */
  statsPlacement?: 'inside' | 'below'
  showSeal?: boolean
  backHref?: string
  backLabel?: string
}) {
  const { t } = useReportLabels()
  const statsBlock =
    stats && stats.length > 0 ? (
      statsPlacement === 'below' ? (
        <div className="lg-kpi-strip">
          {stats.map((stat) => (
            <div key={stat.label} className="lg-kpi">
              <div className="v">
                {stat.value}
                {stat.unit ?? ''}
              </div>
              <div className="l">{stat.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lg-hero-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="lg-hstat">
              <div className="num">
                {stat.value}
                {stat.unit && <span className="unit">{stat.unit}</span>}
              </div>
              <div className="lbl">{stat.label}</div>
            </div>
          ))}
        </div>
      )
    ) : null

  return (
    <>
      <section className="lg-hero">
        <div className="lg-hero-top">
          <div className="lg-brand">
            <HeroBrandMark />
            <div>
              <div className="lg-brand-name">
                {APP_NAME} {t(R.brandIntelligence.en, R.brandIntelligence.ta)}
              </div>
              <div className="lg-brand-sub">{reportKind || APP_TAGLINE}</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            {meta && meta.length > 0 && (
              <div className="lg-doc-meta">
                {meta.map((row) => (
                  <div key={row.label}>
                    {row.label}: <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            )}
            {showSeal && <HeroSeal />}
          </div>
        </div>

        <h1 className="lg-hero-title lg-serif">
          {title}
          {titleEmphasis != null && <em>{titleEmphasis}</em>}
        </h1>

        {quickFacts && <p className="lg-hero-quickfacts">{quickFacts}</p>}
        {description && <p className="lg-hero-desc">{description}</p>}

        {detailLines && detailLines.length > 0 && (
          <div className="lg-hero-details">
            {detailLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        )}

        {backHref && backLabel && (
          <div className="lg-hero-actions">
            <Link to={backHref} className="lg-back-link">
              ← {backLabel}
            </Link>
          </div>
        )}

        {statsPlacement === 'inside' && statsBlock}
      </section>
      {statsPlacement === 'below' && statsBlock}
    </>
  )
}

export function LgSection({
  eyebrow,
  title,
  description,
  children,
  id,
}: {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  id?: string
}) {
  return (
    <section className="lg-section" id={id} data-pdf-block>
      <div className="lg-eyebrow">{eyebrow}</div>
      <h2 className="lg-section-title lg-serif">{title}</h2>
      {description && <p className="lg-section-desc">{description}</p>}
      {children}
    </section>
  )
}

export function LgKpiRow({ items }: { items: { value: string | number; label: string }[] }) {
  return (
    <div className="lg-kpi-row">
      {items.map((item) => (
        <div key={item.label} className="lg-kpi">
          <div className="v">{item.value}</div>
          <div className="l">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export function LgNarrative({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div data-pdf-block>
      {note && (
        <p className="lg-mono text-[0.58rem] uppercase tracking-widest mb-1 text-[color:var(--lg-text-muted)]">
          {note}
        </p>
      )}
      <div className="lg-narrative">{children}</div>
    </div>
  )
}

export function LgInsightFeed({
  title,
  dateLabel,
  rows,
}: {
  title: string
  dateLabel?: string
  rows: { tag: string; tagClass?: string; content: ReactNode }[]
}) {
  return (
    <div className="lg-insight-feed">
      <div className="lg-insight-head">
        <div className="t lg-serif">{title}</div>
        {dateLabel && <div className="d lg-mono">{dateLabel}</div>}
      </div>
      {rows.map((row, idx) => (
        <div key={idx} className="lg-insight-row">
          <span className={`lg-tag ${row.tagClass ?? 'lg-tag-watch'}`}>{row.tag}</span>
          <p>{row.content}</p>
        </div>
      ))}
    </div>
  )
}

export function LgBoardTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="lg-board-wrap">
      <table className="lg-board">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri} className="lg-row-static">
              {cells.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LgFooter({
  windowLabel,
  cohortNote,
}: {
  windowLabel?: string
  cohortNote?: string
} = {}) {
  const { L, t } = useReportLabels()
  const generatedLine = t(
    R.footerGenerated.en.replace('{app}', APP_NAME),
    R.footerGenerated.ta.replace('{app}', APP_NAME),
  )
  return (
    <footer className="lg-footer" data-pdf-block>
      <div>
        <div>{generatedLine}</div>
        {(windowLabel || cohortNote) && (
          <div style={{ marginTop: 4 }}>
            {[windowLabel, cohortNote].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      <span className="lg-mono">{L.footerConfidential}</span>
    </footer>
  )
}
