# Prism — Design System Prompt

> **Usage:** Attach this file to EVERY page/component you build. This is the visual source of truth. It follows the Swotify Plus design system (sapphire × gold × warm surfaces), implemented in `src/styles/index.css` and `src/theme/tokens.ts`.

---

## 1. Brand identity

- **Product name:** Prism
- **Display mark:** Prism**+** (gold accent on the plus)
- **Tagline:** Academic Intelligence Platform
- **One-liner:** Transforms assessments into actionable academic intelligence
- **Personality:** Premium, warm, intelligent, action-first — NOT a boring school ERP
- **Audience:** Students (minimal UI), Tutors (class intelligence), Admins (institution console)
- **Feel:** Like a fintech command center meets warm educational purpose. Every screen should feel designed, not generated.

---

## 2. Color system (strict — do not deviate)

### Primary palette — Sapphire (anchored on `#1C2739`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-sapphire-900` | `#0F172A` | Sidebar bg, deepest text, gradient anchor |
| `--color-sapphire-800` | `#1C2739` | Primary buttons, headings ← **BASE** |
| `--color-sapphire-700` | `#2A3B52` | Button hover states |
| `--color-sapphire-600` | `#3A516E` | Links, active states |
| `--color-sapphire-500` | `#4D6B8F` | Section labels, icons |
| `--color-sapphire-400` | `#6B89AB` | Secondary icons, chart fills, focus ring |
| `--color-sapphire-300` | `#90ADC8` | Sparkline fills, light accents |
| `--color-sapphire-200` | `#B7CDDF` | Light chart bars |
| `--color-sapphire-100` | `#D9E4EE` | Badge backgrounds, hover states |
| `--color-sapphire-50`  | `#EDF2F7` | Ghost button bg, light tints |

### Action color — Solar Gold (CTAs, interventions, urgency)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-gold-700` | `#9A6D04` | Dark gold text on gold bg |
| `--color-gold-600` | `#D4960A` | Metric values, badge text |
| `--color-gold-500` / `--color-accent` | `#F7B731` | Primary action buttons, accent borders |
| `--color-gold-400` | `#FACE6A` | Hover states, sparkline |
| `--color-gold-300` | `#FCD98A` | Chart fills, heatmap "watch" |
| `--color-gold-100` | `#FEF3D6` | Badge bg, icon bg |
| `--color-gold-50`  | `#FFFAEB` | Pipeline stage bg |

### Success — Emerald (positive outcomes, growth)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-emerald-700` | `#047857` | Dark text on green bg |
| `--color-emerald-600` / `--color-leaf` | `#059669` | Success metric values |
| `--color-emerald-500` | `#0CBF6E` | Accent borders, positive deltas |
| `--color-emerald-400` | `#4ADE80` | Chart fills, heatmap "strong" |
| `--color-emerald-100` | `#D1FAE5` | Badge bg, icon bg |
| `--color-emerald-50`  | `#ECFDF5` | Success tint bg |

### Risk — Coral (alerts, at-risk, needs attention)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-coral-700` | `#B91C1C` | Badge text on coral bg |
| `--color-coral-600` | `#DC2626` | Risk metric values, error text |
| `--color-coral-500` / `--color-rose` | `#FF6B6B` | Alert borders, notification dots |
| `--color-coral-400` | `#FCA5A5` | Chart fills, heatmap "at risk" |
| `--color-coral-100` | `#FEE2E2` | Badge bg, icon bg |
| `--color-coral-50`  | `#FEF2F2` | Risk tint bg |

### AI Layer — Violet (AI suggestions, intelligence)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-violet-800` | `#5B21B6` | Deep AI text |
| `--color-violet-700` | `#6D28D9` | AI badge text, labels |
| `--color-violet-600` | `#7C3AED` | AI accent |
| `--color-violet-500` / `--color-ai` | `#8B5CF6` | AI pulse dot, accent borders |
| `--color-violet-400` | `#A78BFA` | Light AI accents |
| `--color-violet-100` | `#EDE9FE` | AI badge bg, icon bg |
| `--color-violet-50`  | `#F5F3FF` | AI insight card bg |

### Neutral surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-surface-0` / `--color-card` | `#FFFFFF` | Card bg, input bg |
| `--color-background` / `--color-paper` | `#FAFAF7` | Page bg, content area |
| `--color-surface-100` / `--color-secondary` | `#F5F4F0` | Section dividers, subtle bg, hover |
| `--color-border` / `--color-surface-200` | `#EEEDEA` | Borders, card borders |
| `--color-surface-300` | `#E0DFDB` | Hover borders |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` / `--color-foreground` / `--color-ink` | `#0F172A` | Primary body text |
| `--color-text-secondary` / `--color-muted-foreground` | `#64748B` | Descriptions, subtitles |
| `--color-text-muted` | `#94A3B8` | Labels, placeholders, hints |
| `--color-text-faint` | `#CBD5E1` | Disabled text |

### Gradients

| Token | Value | Usage |
|-------|-------|-------|
| `--sw-gradient-dark` | `linear-gradient(to bottom right, #0F172A, #1E293B, #0F172A)` | Sidebar, login, dark panels |
| `--sw-gradient-dark-vertical` | `linear-gradient(to bottom, #0F172A, #1E293B, #0F172A)` | Full-height dark panels |
| `--sw-gradient-dark-radial` | `radial-gradient(ellipse at top left, #1E293B, #0F172A)` | Spotlight on dark surfaces |

**Gradient rules:**
- Use the dark gradient for ALL dark surfaces instead of flat `#0F172A`.
- NEVER use gradient on light-mode content cards — cards stay `#FFFFFF` with `#EEEDEA` borders.
- Dark cards on gradient surfaces: `rgba(255,255,255,0.06)` bg + `rgba(255,255,255,0.1)` border.

---

## 3. Typography (strict — do not use other fonts)

```
https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap
```

| Role | Font | Weights | CSS class | Usage |
|------|------|---------|-----------|-------|
| **Display / Headings** | `Sora` | 600, 700 | `font-display` | Page titles, card titles, nav, buttons, badges |
| **Body / Content** | `DM Sans` | 400, 500 | `font-sans` | Paragraphs, descriptions, form inputs, table cells |
| **Data / Metrics** | `IBM Plex Mono` | 400, 500, 600 | `font-mono-data` | Scores, percentages, timestamps |

### Size scale

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Page title | 18–22px | Sora 700 | Hero headings |
| Card title | 14–15px | Sora 600 | Card headers |
| Section label | 10–11px | Sora 600, uppercase, letter-spacing 1.5px | Category labels |
| Body text | 13–14px | DM Sans 400 | Descriptions |
| Small text | 11–12px | DM Sans 400 | Metadata, hints |
| Metric large | 22–28px | IBM Plex Mono 600 | Dashboard numbers |
| Metric small | 13–14px | IBM Plex Mono 500 | Inline stats |
| Badge text | 10–11px | Sora 500 | Status badges |
| Button text | 11–12px | Sora 500 | All buttons |

**NEVER use:** Inter, Roboto, Arial, Poppins, or system fonts as primary.

---

## 4. Component patterns

### Cards (`glass-card`, `baseTheme.panel`)
```css
background: #FFFFFF;
border: 1px solid #EEEDEA;
border-radius: 14px;
overflow: hidden;
```
- Card header: `padding: 18px 20px 14px; border-bottom: 1px solid #F5F4F0;`
- Card body: `padding: 16px 20px;`
- Clickable hover: `translateY(-2px)` + `box-shadow: 0 8px 24px rgba(28,39,57,0.08)`

### Metric cards (left color accent — signature pattern)
Every categorized card MUST have a **4px left accent** via `.metric-card` / `metric` prop.
- Label: Sora 11px, 500, uppercase, `#94A3B8`
- Value: IBM Plex Mono 28px, 600
- Delta: emerald up, coral down

| Category | Accent |
|----------|--------|
| volume | sapphire `#1C2739` |
| healthy | emerald `#0CBF6E` |
| risk | coral `#FF6B6B` |
| caution | gold `#F7B731` |
| activity | violet `#8B5CF6` |
| action | sapphire-600 `#3A516E` |

### Buttons (`.btn` classes)

| Type | Class | Background | Text |
|------|-------|------------|------|
| Primary | `.btn-primary` | sapphire-800 `#1C2739` | white |
| Action (Gold) | `.btn-action` | gold-500 `#F7B731` | sapphire-900 `#0F172A` |
| Outline | `.btn-secondary` | white | ink, 1px `#EEEDEA` |
| Ghost | `.btn-ghost` | sapphire-50 `#EDF2F7` | sapphire-700 `#2A3B52` |
| Danger | `.btn-danger` | coral-600 `#DC2626` | white |

```css
font-family: 'Sora', sans-serif;
font-size: 12px;
font-weight: 500;
padding: 8px 18px;
border-radius: 8px;
/* Active: transform: scale(0.97) */
```

### Badges

```css
padding: 3px 10px;
border-radius: 20px;
font-family: 'Sora', sans-serif;
font-size: 10.5px;
font-weight: 500;
```

| Status | Background | Text |
|--------|-----------|------|
| Risk detected | coral-100 | coral-700 |
| AI suggested | violet-100 | violet-700 |
| In progress | gold-100 | gold-700 |
| Outcome positive | emerald-100 | emerald-700 |
| Teacher approved | sapphire-100 | sapphire-700 |

### Sidebar (`AppShell` / `.csc-sidebar`)

```
- Width: 260px, fixed left
- Background: dark gradient — NOT flat color
- Nav items: 13.5px, rgba(255,255,255,0.55) default, white when active
- Active nav: rgba(255,255,255,0.1) bg, gold icon
- Section labels: 10px, uppercase, letter-spacing 1.5px, rgba(255,255,255,0.25)
- Footer avatar: sapphire-to-violet gradient
```

### Header

```
- Height: 64px, sticky, white bg
- Icon buttons: 38×38px, radius 10px, surface-200 border
- Notification dot: 8px coral circle
- AI pulse: 9px violet circle
```

### Inputs

```css
font-family: 'DM Sans', sans-serif;
font-size: 13px;
padding: 10px 14px;
border: 1px solid #EEEDEA;
border-radius: 10px;
background: #FFFFFF;
/* Focus */
border-color: #6B89AB;
box-shadow: 0 0 0 3px rgba(107, 137, 171, 0.12);
```

### Tables

```
- Header: Sora 11px, 500, uppercase, muted, surface-50 bg
- Cells: DM Sans 13px, ink
- Row borders: 1px solid surface-100
- Row hover: surface-50
- Numeric cells: IBM Plex Mono, right-aligned
```

---

## 5. Layout rules

| Element | Value |
|---------|-------|
| Page background | `#FAFAF7` |
| Content padding | `24px 28px` (`p-4 sm:p-6 lg:p-8`) |
| Card gap | `16–20px` |
| Metric row | `repeat(4, 1fr)` |
| Border radius (cards) | `14px` |
| Border radius (buttons) | `8px` |
| Border radius (inputs) | `10px` |
| Border radius (badges) | `20px` pill |
| Borders | `1px solid #EEEDEA` |
| Max content width | `1400px` centered |

---

## 6. Color assignment rules (critical)

| Context | Color ramp | Usage |
|---------|-----------|-------|
| **Brand / Navigation / Tutor** | Sapphire | Primary nav, buttons, default UI |
| **Actions / Interventions / CTAs** | Gold | Action buttons, urgency |
| **Positive outcomes / Growth** | Emerald | Success metrics, improvements |
| **Risk / Alerts / Attention** | Coral | At-risk badges, declining metrics |
| **AI suggestions / Intelligence** | Violet | AI-generated content, ML outputs |

### Left-border accent (signature pattern)

Every categorized card/item MUST have a `3–4px` left border in its category color. No radius on that side.

---

## 7. Iconography

- Lucide React, 16–18px nav, 14–16px inline
- Icon color inherits from parent text
- Stage chips: 40×40px, radius 10px

| Stage | Icon bg | Icon color |
|-------|---------|------------|
| Detect / risk | coral-100 | coral-600 |
| AI Suggest | violet-100 | violet-700 |
| Action | gold-100 | gold-700 |
| Outcome | emerald-100 | emerald-700 |

---

## 8. Animation guidelines

```css
/* Card hover */
transform: translateY(-2px);
box-shadow: 0 8px 24px rgba(28, 39, 57, 0.08);

/* Button active */
transform: scale(0.97);

/* AI pulse */
box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);

/* Focus ring */
box-shadow: 0 0 0 3px rgba(107, 137, 171, 0.12);
```

Keep shadows subtle — **0.08 opacity max**.

---

## 9. Dark mode (sidebar / command center)

```css
background: linear-gradient(to bottom right, #0F172A, #1E293B, #0F172A);
/* Dark cards */ background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.1);
/* Text */ primary #FFFFFF; secondary rgba(255,255,255,0.55); muted rgba(255,255,255,0.25);
/* Metrics use 400 shades of each ramp */
```

---

## 10. Role-specific UI rules

| Role | Density | Primary color | Dashboard style | Key pattern |
|------|---------|---------------|-----------------|-------------|
| **Student** | **Minimal** | Sapphire + Gold | Light warm paper | One hero metric, max 3–4 nav items, no tables |
| **Tutor** | Data-rich | Sapphire | Light mode | Class cards, assessment builder, question bank |
| **Admin** | Data-rich | Sapphire + Gold KPIs | Light + dark sidebar | Institution analytics, centers |

### Student minimal rules

- Nav: Today, Study Plan, Assessments, Reports
- One hero metric per screen
- No data tables on student screens
- Outcome language: "Fix this → +12%" not "Score: 72%"

---

## 11. Do NOT do these

- ❌ Do NOT use Inter, Roboto, Arial, Poppins, or system fonts
- ❌ Do NOT use generic purple-on-white gradients
- ❌ Do NOT use random colors — every color has a semantic meaning
- ❌ Do NOT use heavy drop shadows — keep shadows subtle (0.08 opacity max)
- ❌ Do NOT use border-radius on single-sided left accent lines
- ❌ Do NOT mix color assignments (gold for risk, coral for success)
- ❌ Do NOT make it look like a school ERP
- ❌ Do NOT use emojis in UI — use Lucide icons
- ❌ Do NOT use font-size below 10px
- ❌ Do NOT use pure black `#000000` — always use `#0F172A`

---

## 12. Code references (implement, don't duplicate)

| Need | Import from |
|------|-------------|
| Color tokens | `@/theme/tokens` |
| Component class strings | `@/theme/baseTheme` |
| Tone accent classes | `getToneClasses()` from `@/theme/baseTheme` |
| App shell layout | `@/components/layout/AppShell` |
| Page header / cards / stats | `PageHeader`, `AppCard`, `AppStat` from AppShell |
| Buttons | `.btn` / `.btn-primary` / `.btn-action` |
| Health badges | `HEALTH_CONFIG` from `@/lib/constants` |

---

## 13. Prompt template

```
Build the [PAGE NAME] page for Prism.
Follow PRISM_DESIGN_SYSTEM.md (Swotify Plus sapphire × gold system).
Use tokens from src/theme/tokens.ts and classes from src/styles/index.css.

Semantic colors:
- sapphire = brand / nav / primary buttons
- gold = CTAs / interventions
- emerald = success
- coral = risk
- violet = AI

This page should:
- [Functional requirement]

Role context: This page is for [Student/Tutor/Admin].
```

---

*Prism Design System — Swotify Plus structure · Sapphire ramp anchored on `#1C2739` · Matches `index.css` + `tokens.ts`*
