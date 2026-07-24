# Prism — Design System Prompt

> **Usage:** Attach this file to EVERY page/component you build. Paste it as context in Cursor, Bolt, v0, Lovable, Claude, or any AI coding tool. This ensures visual consistency across your entire platform.

---

## 1. Brand identity

- **Product name:** Prism
- **Display mark:** Prism**+** (gold accent on the plus)
- **Parent brand:** CSC Centre Prism Software
- **Tagline:** Academic Intelligence Platform
- **One-liner:** Transforms assessments into actionable academic intelligence
- **Personality:** Premium, warm, intelligent, outcome-first — NOT a boring school ERP or generic LMS
- **Audience:** Students (minimal UI), Tutors (class intelligence), Admins (institution console)
- **Feel:** Warm golden paper + settled navy ink + CSC gold accents. Like a fintech command center meets warm educational purpose. Every screen should feel **designed**, not generated.

---

## 2. Color system (strict — do not deviate)

> **Important:** This palette is already implemented in `src/styles/index.css` and `src/theme/tokens.ts`. Do NOT swap in Swotify sapphire hex values — use these Prism tokens only.

### Primary palette — Navy Blue (anchored on `#163A66`)

| Token (CSS) | Hex | Tailwind | Usage |
|-------------|-----|----------|-------|
| `--color-blue-900` / `--ln-navy-900` | `#0C2238` | `blue-900` | Deepest text, gradient anchor, accent-foreground |
| `--color-blue-800` / `--ln-navy-800` | `#163A66` | `blue-800`, `ink` | Primary buttons, headings ← **BASE** |
| `--color-blue-700` | `#1E4A82` | `blue-700` | Button hover, gradient mid |
| `--color-blue-600` | `#2A60A8` | `blue-600` | Active links |
| `--color-blue-500` | `#3575C4` | `blue-500` | Section labels, chart primary |
| `--color-blue-400` | `#5290DA` | `blue-400` | Focus rings, secondary icons |
| `--color-blue-300` | `#7AADE6` | `blue-300` | Sparkline fills |
| `--color-blue-200` | `#A8C8F0` | `blue-200` | Light chart bars |
| `--color-blue-100` | `#D4E6FC` | `blue-100` | Badge backgrounds |
| `--color-blue-50` | `#EDF4FF` | `blue-50` | Ghost button bg |

### Action color — CSC Gold (CTAs, recovery, urgency)

| Token (CSS) | Hex | Tailwind | Usage |
|-------------|-----|----------|-------|
| `--color-yellow-700` | `#966F00` | `yellow-700` | Dark text on gold bg |
| `--color-yellow-600` | `#B8860B` | `yellow-600` | Metric values, badge text |
| `--color-yellow-500` | `#D4A008` | `yellow-500` | Strong gold accents |
| `--color-yellow-400` / `--color-accent` | `#E8B820` | `yellow-400`, `accent` | Primary action buttons, logo +, active nav icon |
| `--color-yellow-300` | `#F5C830` | `yellow-300` | Hover on action buttons |
| `--color-yellow-200` | `#FFD966` | `yellow-200` | Chart fills, heatmap "watch" |
| `--color-yellow-100` | `#FFECB3` | `yellow-100` | Badge bg, icon bg |
| `--color-yellow-50` | `#FFF9E6` | `yellow-50` | Pipeline / plan stage bg |

### Success — Emerald (positive outcomes, growth)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--ln-emerald-700` | `#047857` | `emerald-700` | Dark text on green bg |
| `--ln-emerald-600` / `--color-leaf` | `#059669` | `emerald-600`, `leaf` | Success metrics, positive deltas |
| `--ln-emerald-500` | `#10B981` | `emerald-500` | Accent borders |
| `--ln-emerald-100` | `#D1FAE5` | `emerald-100` | Badge bg |
| `--ln-emerald-50` | `#ECFDF5` | `emerald-50` | Success tint bg |

### Risk — Rose (gaps, alerts, at-risk)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--ln-rose-700` | `#BE123C` | `rose-700` | Badge text on rose bg |
| `--ln-rose-600` / `--color-rose` | `#E11D48` | `rose-600`, `rose` | Risk metrics, errors, notification dots |
| `--ln-rose-500` | `#F43F5E` | `rose-500` | Alert borders |
| `--ln-rose-100` | `#FFE4E6` | `rose-100` | Badge bg |
| `--ln-rose-50` | `#FFF1F2` | `rose-50` | Risk tint bg |

### Intelligence — Indigo (AI suggestions only)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--ln-indigo-700` | `#4338CA` | `indigo-700` | AI badge text |
| `--ln-indigo-600` | `#4F46E5` | `indigo-600` | AI accent |
| `--ln-indigo-500` | `#6366F1` | `indigo-500` | AI pulse dot, insight borders |
| `--ln-indigo-100` | `#E0E7FF` | `indigo-100` | AI badge bg |
| `--ln-indigo-50` | `#EEF2FF` | `indigo-50` | AI insight card bg |

### Neutral surfaces — warm golden paper (NOT cool grey)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--color-surface-0` / `--color-card` | `#FFFFFF` | `surface-0`, `card` | Card bg, input bg |
| `--color-background` / `--color-paper` | `#FFFAEB` | `paper`, `background` | Page bg, app shell |
| `--color-surface-50` | `#FFFBF0` | `surface-50` | Subtle section bg |
| `--color-secondary` | `#FEF3D6` | `secondary` | Hover states, ghost areas |
| `--color-surface-100` | `#FEF3D6` | `surface-100` | Section dividers |
| `--color-border` / `--color-surface-200` | `#EDE4CC` / `#F5E8C8` | `border`, `surface-200` | Card borders |
| `--color-surface-300` | `#EAD9B0` | `surface-300` | Hover borders |

### Text

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--color-text-primary` / `--color-foreground` / `--color-ink` | `#163A66` | `ink`, `foreground` | Primary body text |
| `--color-text-secondary` | `#466080` | `text-secondary` | Descriptions, subtitles |
| `--color-text-muted` / `--color-muted-foreground` | `#6E8499` | `muted-foreground` | Labels, placeholders |
| `--color-text-faint` | `#A3B5C8` | `text-faint` | Disabled text |

### Gradients

| Token | Value | Usage |
|-------|-------|-------|
| `--ln-gradient-dark` | `linear-gradient(to bottom right, #0C2238, #1E4A82, #0C2238)` | Sidebar bg, login hero, dark panels |
| `--ln-gradient-gold` | `linear-gradient(135deg, #F5C830 0%, #E8B820 100%)` | Brand icon, action highlights |
| `--ln-gradient-mesh` / `.app-page-bg` | Warm radial gold + linear `#FFFAEB → #FFFBF0` | Page background (light mode) |
| `--ln-gradient-progress-blue` | `linear-gradient(90deg, #7AADE6, #3575C4)` | Navy progress bars |
| `--ln-gradient-progress-gold` | `linear-gradient(90deg, #FFD966, #E8B820)` | Action progress bars |

**Gradient rules:**
- Use `--ln-gradient-dark` for ALL dark surfaces (sidebar, login left panel) — never flat `#0C2238` alone.
- Use `.app-page-bg` / mesh gradient for light content areas — this is Prism's signature warm paper feel.
- **NEVER** apply dark gradients on white cards. Cards stay `#FFFFFF` with warm borders.
- Dark cards on gradient surfaces: `rgba(255,255,255,0.06)` bg + `rgba(255,255,255,0.1)` border.

---

## 3. Typography (strict — do not use other fonts)

```
Font imports (already in index.html):
https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap
```

| Role | Font | Weights | CSS class | Usage |
|------|------|---------|-----------|-------|
| **Display / Headings** | `Sora` | 600, 700 | `font-display` | Page titles, card titles, nav, buttons, badges |
| **Body / Content** | `DM Sans` | 400, 500 | `font-sans` | Paragraphs, descriptions, form inputs, table cells |
| **Data / Metrics** | `IBM Plex Mono` | 400, 500, 600 | `font-mono-data` | Scores, percentages, timestamps |

### Size scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Page title | 18–22px (`text-2xl`–`text-4xl`) | Sora 700 | Hero headings |
| Card title | 14–15px | Sora 600 | Card headers |
| Section label (eyebrow) | 10–11px | Sora 600, uppercase, `tracking-[0.2em]` | Category labels |
| Body text | 13–14px | DM Sans 400 | Descriptions |
| Small text | 11–12px | DM Sans 400 | Metadata, hints |
| Metric large | 22–28px | IBM Plex Mono 600 | Dashboard numbers |
| Metric small | 13–14px | IBM Plex Mono 500 | Inline stats |
| Badge text | 10–11px | Sora 500 | Status badges |
| Button text | 11–12px | Sora 500 | All buttons |

**NEVER use:** Inter, Roboto, Arial, Poppins, or system fonts as primary.

---

## 4. Component patterns

### Cards (`AppCard`, `baseTheme.panel`)
```css
background: var(--color-card);          /* #FFFFFF */
border: 1px solid var(--color-border);  /* #EDE4CC */
border-radius: 14px;                    /* --radius-card */
box-shadow: 0 1px 2px rgba(184,134,11,0.05), 0 2px 10px rgba(22,58,102,0.06); /* .shadow-card */
```
- Card header: `padding: 18px 20px 14px; border-bottom: 1px solid var(--color-surface-100);`
- Card body: `padding: 16px 20px;`
- Clickable hover: `.card-hover` → `translateY(-2px)` + `.shadow-card-raised`

### Metric cards (left color accent — signature pattern)
```css
/* Use baseTheme.statCard or toneStyles accent classes */
border-left: 4px solid;  /* color by semantic tone */
border-radius: 14px;     /* full radius on card; accent is left-only */
```
- Label: Sora 11px, 500, uppercase, `text-muted-foreground`
- Value: `font-mono-data` 28px, 600, colored by tone
- Delta: 12px, emerald (`leaf`) up, rose down

**Tone classes** (from `src/theme/baseTheme.ts`):
- `toneStyles.blue.accent` → navy metrics
- `toneStyles.yellow.accent` → action metrics
- `toneStyles.emerald.accent` → success
- `toneStyles.rose.accent` → risk
- `toneStyles.indigo.accent` → AI

### Buttons (use `.btn` classes from `index.css`)

| Type | Class | Background | Text |
|------|-------|-----------|------|
| Primary | `.btn-primary` | `ink` (#163A66) | `paper` (#FFFAEB) |
| Action (Gold) | `.btn-action` | `accent` (#E8B820) | `ink` (#0C2238) |
| Secondary | `.btn-secondary` | `card` white | `ink`, border `border` |
| Ghost | `.btn-ghost` | transparent | `muted-foreground` |
| Danger | `.btn-danger` | `rose` | white |

```css
font-family: 'Sora', sans-serif;
font-size: 12px;
font-weight: 500;
padding: 8px 18px;
border-radius: 8px;
transition: all 0.2s;
/* Active: transform: scale(0.98) */
```

Import via `btnClass` from `@/components/ui/Button` or use classes directly.

### Badges

```css
display: inline-flex;
align-items: center;
gap: 4px;
padding: 3px 10px;
border-radius: 20px;
font-family: 'Sora', sans-serif;
font-size: 10.5px;
font-weight: 500;
```

| Status | Background | Text |
|--------|-----------|------|
| Risk / critical | `rose-100` | `rose-700` |
| AI suggested | `indigo-100` | `indigo-700` |
| In progress / fair | `yellow-100` | `yellow-700` |
| Positive / good | `emerald-100` | `emerald-700` |
| Brand / neutral | `blue-100` | `blue-700` |

Use `HEALTH_CONFIG` from `@/lib/constants` for student health badges.

### Sidebar (`AppShell`)

```
- Width: 260px (--sidebar-w), hidden on mobile → drawer
- Top brand bar: navy icon box + "Prism+" (gold plus)
- Nav: DM Sans/Sora 13px, muted default, white/navy on active
- Active nav: bg-secondary, gold dot indicator
- Mobile: breadcrumb in header FIRST, logo SECOND
- Footer: user avatar initials, role label, sign out
```

Dark sidebar variant (optional admin):
```
background: var(--ln-gradient-dark);
/* Tailwind: .gradient-dark */
active icon color: var(--color-accent) (#E8B820)
```

### Header (`AppShell` top bar)

```
- Height: 56px mobile / 64px desktop
- Background: card/80 with backdrop-blur
- Mobile: [Menu] [Breadcrumb] ... [Bell] | [Logo]
- Desktop: [Logo block 260px] [Academic year] [Search] [Bell]
- Notification dot: rose-500, 8px
```

### Inputs & forms (`baseTheme.input`)

```css
font-family: 'DM Sans', sans-serif;
font-size: 13px;
padding: 10px 14px;
border: 1px solid var(--color-border);
border-radius: 10px;
background: var(--color-card);
/* Focus */
border-color: var(--color-blue-400);
box-shadow: 0 0 0 3px rgba(82, 144, 218, 0.12);
```

Use `AppSelect` for dropdowns — match input border/focus styles.

### Progress bars

```css
/* Track */
height: 6px;
background: var(--color-surface-200);
border-radius: 3px;
/* Fill — context dependent */
background: linear-gradient(90deg, #FFD966, #E8B820);  /* gold */
background: linear-gradient(90deg, #7AADE6, #3575C4); /* navy */
```

### Avatars

```css
width: 36px; height: 36px; border-radius: 50%;
font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600;
/* Student sidebar: bg-accent/20 text-accent */
/* Admin dark: gradient navy-to-indigo */
```

### Tables

```
- Header: Sora 11px, 500, uppercase, text-muted-foreground, surface-50 bg
- Cells: DM Sans 13px, text-ink
- Row borders: 1px solid border/surface-200
- Row hover: bg-secondary/30
- Numeric cells: font-mono-data, right-aligned
```

---

## 5. Layout rules

| Element | Value |
|---------|-------|
| Page background | `.app-page-bg` / `#FFFAEB` warm mesh |
| Content padding | `p-4 sm:p-6 lg:p-8` |
| Card gap | `16–20px` (`gap-4` / `gap-5`) |
| Metric row | `grid-cols-1 md:grid-cols-3 lg:grid-cols-4` |
| Main + sidebar | `grid-cols-1 lg:grid-cols-[1.6fr_1fr]` |
| Border radius (cards) | `14px` |
| Border radius (buttons) | `8px` |
| Border radius (inputs) | `10px` |
| Border radius (badges) | `20px` pill |
| Borders | `1px solid border` (#EDE4CC) |
| Max content width | `1400px` centered (`max-w-[1400px]`) |

---

## 6. Color assignment rules (critical)

Every UI element has a semantic color. Do NOT randomly assign colors.

| Context | Color ramp | Tailwind prefix | Usage |
|---------|-----------|-----------------|-------|
| **Brand / Navigation / Tutor** | Navy Blue | `blue-*`, `ink` | Primary nav, buttons, default UI |
| **Actions / Recovery / CTAs** | CSC Gold | `yellow-*`, `accent` | Action buttons, interventions, urgency |
| **Positive outcomes / Growth** | Emerald | `emerald-*`, `leaf` | Success metrics, improvements |
| **Risk / Gaps / Alerts** | Rose | `rose-*` | At-risk badges, declining metrics |
| **AI suggestions** | Indigo | `indigo-*` | AI placeholders, ML outputs |

### Left-border accent pattern (signature Prism pattern)

Every categorized card/item MUST have a `3–4px left border` in its category color:

```html
<!-- Tailwind utilities in index.css -->
<div class="accent-yellow border-l-[3px] ...">  <!-- action -->
<div class="accent-blue ...">                   <!-- brand -->
<div class="accent-emerald ...">                <!-- success -->
<div class="accent-rose ...">                   <!-- risk -->
<div class="accent-indigo ...">                 <!-- AI -->
```

Or use `baseTheme.statCard` + `getToneClasses('yellow', 'accent')`.

---

## 7. Iconography

- **Library:** Lucide React (already used)
- **Sizes:** 16–18px nav, 14–16px inline, 3.5–4 w/h in Tailwind
- **Color:** inherit from parent text
- **Brand icon:** `GraduationCap` in navy box, or gold gradient `gradient-brand-icon`

| Context | Icon bg | Icon color |
|---------|---------|------------|
| Risk / gap | `rose-100` | `rose-600` |
| AI insight | `indigo-100` | `indigo-600` |
| Action / plan | `yellow-100` | `yellow-700` |
| Success | `emerald-100` | `emerald-600` |
| Brand | `blue-100` | `blue-600` |

---

## 8. Animation guidelines

```css
/* Card hover — .card-hover */
transition: transform 0.2s, box-shadow 0.2s;
transform: translateY(-2px);

/* Button active — built into .btn-* */
transform: scale(0.98);

/* Page load — .animate-fade-in-up */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* AI pulse — .ai-pulse */
@keyframes ai-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0); }
}

/* Focus ring */
box-shadow: 0 0 0 3px rgba(82, 144, 218, 0.12);
```

---

## 9. Dark mode (admin command center / sidebar)

```css
/* Dark surfaces — use gradient */
background: linear-gradient(to bottom right, #0C2238, #1E4A82, #0C2238);
/* class: .gradient-dark */

/* Dark cards on gradient */
background: rgba(255, 255, 255, 0.06);
border: 0.5px solid rgba(255, 255, 255, 0.1);

/* Dark text */
primary: #FFFFFF;
secondary: rgba(255, 255, 255, 0.55);
muted: rgba(255, 255, 255, 0.25);

/* Dark metrics — use 400 shades */
navy: #5290DA;
gold: #E8B820;
emerald: #34C997;
rose: #F4728A;
indigo: #818CF8;
```

---

## 10. Role-specific UI rules

| Role | Density | Primary color | Dashboard style | Key pattern |
|------|---------|---------------|-----------------|-------------|
| **Student** | **Minimal** | Navy + Gold | Light warm paper | One hero metric, max 3–4 nav items, no tables |
| **Tutor** | Data-rich | Navy | Light mode | Class cards, assessment builder, question bank |
| **Admin** | Data-rich | Navy + Gold KPIs | Light + optional dark sidebar | Institution analytics, centers, hierarchy |

### Student minimal rules (critical)

- **Nav items:** Today, Study Plan, Assessments, Reports (+ Notifications)
- **One hero metric** per screen (health % or next action)
- **No data tables** on student screens
- **Outcome language:** "Fix this → +12%" not "Score: 72%"
- **Plain language:** no jargon for gaps/readiness

### Academic hierarchy (all roles)

**Board → Grade → Subject → Chapter → Topic → Question → Assessment**

---

## 11. Do NOT do these

- ❌ Do NOT use Swotify sapphire hex (`#1C2739`) — use Prism navy (`#163A66`)
- ❌ Do NOT use cool grey surfaces (`#FAFAF7`) — use warm golden paper (`#FFFAEB`)
- ❌ Do NOT use Inter, Roboto, Arial, Poppins
- ❌ Do NOT use generic purple-on-white gradients
- ❌ Do NOT assign colors randomly (gold for risk, rose for success)
- ❌ Do NOT use heavy drop shadows — max `0.1` opacity navy/gold tint
- ❌ Do NOT use border-radius on single-sided left accent borders
- ❌ Do NOT make student screens data-dense — keep minimal
- ❌ Do NOT use emojis in UI — use Lucide icons
- ❌ Do NOT use font-size below 10px
- ❌ Do NOT use pure black `#000000` — use `ink` `#163A66`

---

## 12. CSS variables block (matches `index.css` @theme)

```css
:root {
  /* Navy blue — primary */
  --ln-navy-900: #0C2238;
  --ln-navy-800: #163A66;
  --ln-navy-700: #1E4A82;
  --ln-navy-600: #2A60A8;
  --ln-navy-500: #3575C4;
  --ln-navy-400: #5290DA;
  --ln-navy-300: #7AADE6;
  --ln-navy-200: #A8C8F0;
  --ln-navy-100: #D4E6FC;
  --ln-navy-50: #EDF4FF;

  /* CSC gold — action */
  --ln-gold-700: #966F00;
  --ln-gold-600: #B8860B;
  --ln-gold-500: #D4A008;
  --ln-gold-400: #E8B820;
  --ln-gold-300: #F5C830;
  --ln-gold-200: #FFD966;
  --ln-gold-100: #FFECB3;
  --ln-gold-50: #FFF9E6;

  /* Emerald */
  --ln-emerald-700: #047857;
  --ln-emerald-600: #059669;
  --ln-emerald-500: #10B981;
  --ln-emerald-100: #D1FAE5;
  --ln-emerald-50: #ECFDF5;

  /* Rose */
  --ln-rose-700: #BE123C;
  --ln-rose-600: #E11D48;
  --ln-rose-500: #F43F5E;
  --ln-rose-100: #FFE4E6;
  --ln-rose-50: #FFF1F2;

  /* Indigo (AI) */
  --ln-indigo-700: #4338CA;
  --ln-indigo-600: #4F46E5;
  --ln-indigo-500: #6366F1;
  --ln-indigo-100: #E0E7FF;
  --ln-indigo-50: #EEF2FF;

  /* Warm surfaces */
  --ln-surface-0: #FFFFFF;
  --ln-surface-50: #FFFBF0;
  --ln-surface-100: #FEF3D6;
  --ln-surface-200: #F5E8C8;
  --ln-surface-300: #EAD9B0;
  --ln-paper: #FFFAEB;

  /* Text */
  --ln-text-primary: #163A66;
  --ln-text-secondary: #466080;
  --ln-text-muted: #6E8499;
  --ln-text-faint: #A3B5C8;

  /* Gradients */
  --ln-gradient-dark: linear-gradient(to bottom right, #0C2238, #1E4A82, #0C2238);
  --ln-gradient-gold: linear-gradient(135deg, #F5C830 0%, #E8B820 100%);
  --ln-gradient-mesh:
    radial-gradient(ellipse 90% 55% at 50% -15%, rgba(232, 184, 32, 0.14), transparent 55%),
    radial-gradient(ellipse 55% 45% at 100% 0%, rgba(255, 236, 179, 0.42), transparent 50%),
    linear-gradient(180deg, #FFFAEB 0%, #FFF8E6 48%, #FFFBF0 100%);

  /* Layout */
  --sidebar-w: 260px;
  --header-h: 64px;
  --radius-card: 14px;
  --radius-btn: 8px;
  --radius-input: 10px;
  --radius-badge: 20px;
}
```

**Tailwind aliases** (use in components):
- `ink` = navy-800 text
- `paper` / `background` = warm page bg
- `accent` = gold-400
- `leaf` = emerald-600
- `rose` = rose-600
- `card`, `border`, `secondary` = warm surfaces

---

## 13. Code references (implement, don't duplicate)

| Need | Import from |
|------|-------------|
| Color tokens | `@/theme/tokens` |
| Component class strings | `@/theme/baseTheme` |
| Tone accent classes | `getToneClasses()` from `@/theme/baseTheme` |
| App shell layout | `@/components/layout/AppShell` |
| Page header / cards / stats | `PageHeader`, `AppCard`, `AppStat` from AppShell |
| Buttons | `btnClass` from `@/components/ui/Button` |
| Health badges | `HEALTH_CONFIG` from `@/lib/constants` |
| AI placeholder | `AiInsightsPlaceholder` |

---

## 14. Prompt template

When building a new page, start your prompt like this:

```
Build the [PAGE NAME] page for Prism.
Follow the attached PRISM_DESIGN_SYSTEM.md for all colors, fonts,
components, and layout rules. Use the exact CSS variables, Tailwind tokens
(ink, accent, paper, leaf, rose), and component patterns defined there.

Do NOT use Swotify colors — use Prism warm navy + gold palette only.

This page should:
- [Functional requirement]
- [Functional requirement]

Role context: [Student / Tutor / Admin]
Student pages MUST follow minimal rules (section 10).
```

---

## 15. Module architecture

```
prism_fe/src/
├── theme/           tokens.ts, baseTheme.ts
├── styles/          index.css (@theme + .btn + utilities)
├── modules/
│   ├── auth/        Login, role selection
│   ├── student/     Minimal portal
│   ├── tutor/       Class intelligence
│   └── admin/       Institution console
├── components/      Shared UI + AppShell layout
├── hooks/           API providers (bootstrap, analytics, etc.)
└── app/             Router shell
```

---

*Prism Design System v2.0 — Swotify-style structure · CSC warm navy + gold palette · Matches `index.css` + `tokens.ts` implementation*
