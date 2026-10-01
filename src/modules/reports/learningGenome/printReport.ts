import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PDF_MARGIN_MM = 10
const PDF_PAGE_WIDTH_MM = 210
const PDF_CONTENT_WIDTH_MM = PDF_PAGE_WIDTH_MM - PDF_MARGIN_MM * 2
const PDF_PAGE_HEIGHT_MM = 297
const PDF_CONTENT_HEIGHT_MM = PDF_PAGE_HEIGHT_MM - PDF_MARGIN_MM * 2
const PX_PER_MM = 96 / 25.4
const MIN_CAPTURE_WIDTH_PX = Math.round(PDF_CONTENT_WIDTH_MM * PX_PER_MM)

const PARCHMENT = { r: 246, g: 241, b: 228 }
const NAVY = { r: 11, g: 31, b: 58 }

const CHART_SELECTOR =
  '.lg-chart-frame, .recharts-responsive-container, [data-pdf-chart]'

const PARCHMENT_BG = '#f6f1e4'
const NAVY_BG = 'rgb(11, 31, 58)'

/** Small gap between consecutive blocks on the same PDF page (mm). */
const BLOCK_GAP_MM = 2
/** Start a new page when less than this remains (mm). */
const MIN_REMAINING_MM = 12

type CaptureItem =
  | { kind: 'element'; el: HTMLElement }
  | { kind: 'section-header'; section: HTMLElement; width: number }

function safeFilename(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^\w\s\-—.]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
  const base = (cleaned || 'report').slice(0, 72)
  return base.startsWith('report_') ? base : `report_${base}`
}

function blendRgba(
  r: number,
  g: number,
  b: number,
  a: number,
  bg: { r: number; g: number; b: number },
): string {
  if (a >= 0.98) return `rgb(${r}, ${g}, ${b})`
  const R = Math.round(r * a + bg.r * (1 - a))
  const G = Math.round(g * a + bg.g * (1 - a))
  const B = Math.round(b * a + bg.b * (1 - a))
  return `rgb(${R}, ${G}, ${B})`
}

function parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (!m) return null
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] !== undefined ? Number(m[4]) : 1,
  }
}

function solidifyBackground(el: HTMLElement, fallbackBg: { r: number; g: number; b: number }) {
  const parsed = parseRgba(window.getComputedStyle(el).backgroundColor)
  if (!parsed || parsed.a >= 0.98 || parsed.a <= 0.01) return
  el.style.backgroundColor = blendRgba(parsed.r, parsed.g, parsed.b, parsed.a, fallbackBg)
}

export function solidifyCloneForPdf(clone: HTMLElement) {
  clone.classList.remove('atlas-page-reveal')
  clone.style.animation = 'none'
  clone.style.transition = 'none'
  clone.style.opacity = '1'
  clone.style.transform = 'none'
  clone.style.filter = 'none'
  clone.style.backdropFilter = 'none'
  clone.style.setProperty('-webkit-backdrop-filter', 'none')

  clone.querySelectorAll<HTMLElement>('[style*="height"]').forEach((el) => {
    const inline = el.getAttribute('style') ?? ''
    const m = inline.match(/height:\s*(\d+)px/)
    if (m) {
      el.style.height = `${m[1]}px`
      el.style.minHeight = `${m[1]}px`
    }
  })

  clone.querySelectorAll<HTMLElement>('.recharts-wrapper, .recharts-responsive-container').forEach(
    (el) => {
      const parent = el.parentElement
      const h =
        parent?.offsetHeight ||
        parent?.getBoundingClientRect().height ||
        Number.parseInt(el.style.height, 10) ||
        180
      el.style.width = '100%'
      el.style.height = `${Math.max(h, 120)}px`
      el.style.minHeight = `${Math.max(h, 120)}px`
    },
  )

  // Percentage-width CSS bars sometimes collapse in clones — bake computed width.
  clone.querySelectorAll<HTMLElement>('.lg-affinity-fill, .lg-kl-bar-fill, .lg-mini-bar-fill').forEach(
    (el) => {
      const widthPct = el.style.width
      if (widthPct) {
        el.style.width = widthPct
        el.style.minWidth = widthPct
      }
      el.style.printColorAdjust = 'exact'
      el.style.setProperty('-webkit-print-color-adjust', 'exact')
    },
  )

  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    el.style.animation = 'none'
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = 'none'
    el.style.filter = 'none'
    el.style.backdropFilter = 'none'
    el.style.setProperty('-webkit-backdrop-filter', 'none')

    const inDark =
      el.closest('.lg-hero, .lg-detail-head, .lg-footer, .lg-kl-section, .lg-insight-feed') !== null
    const bgBase = inDark ? NAVY : PARCHMENT
    solidifyBackground(el, bgBase)
  })
}

/**
 * Recharts / SVG charts often render at 0×0 in an off-screen clone.
 * Rasterize the live on-screen charts and swap them into the clone as images.
 */
async function rasterizeLiveChartsIntoClone(sourceRoot: HTMLElement, clone: HTMLElement) {
  const sourceCharts = Array.from(
    sourceRoot.querySelectorAll<HTMLElement>(CHART_SELECTOR),
  ).filter((el) => el.offsetWidth > 2 && el.offsetHeight > 2)

  const cloneCharts = Array.from(clone.querySelectorAll<HTMLElement>(CHART_SELECTOR))
  const count = Math.min(sourceCharts.length, cloneCharts.length)

  for (let i = 0; i < count; i++) {
    const src = sourceCharts[i]
    const dst = cloneCharts[i]
    try {
      const canvas = await html2canvas(src, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
        scrollX: 0,
        scrollY: 0,
      })
      if (!canvas.width || !canvas.height) continue
      const img = document.createElement('img')
      img.src = canvas.toDataURL('image/png')
      img.alt = 'Chart'
      img.setAttribute('data-pdf-chart-image', 'true')
      img.style.cssText = [
        'display:block',
        'width:100%',
        'max-width:100%',
        'height:auto',
        `min-height:${Math.max(src.offsetHeight, 120)}px`,
        'object-fit:contain',
      ].join(';')
      dst.replaceWith(img)
    } catch (err) {
      console.warn('PDF chart rasterize failed', err)
    }
  }
}

function applyPdfSpacingStyles(clone: HTMLElement, captureWidth: number) {
  const sectionPadX = Math.min(52, Math.max(20, Math.round(captureWidth * 0.045)))
  const sectionPadY = 18

  clone.querySelectorAll<HTMLElement>('.lg-section, section.lg-section').forEach((el) => {
    el.style.paddingLeft = `${sectionPadX}px`
    el.style.paddingRight = `${sectionPadX}px`
    el.style.paddingTop = `${sectionPadY}px`
    el.style.paddingBottom = `${sectionPadY}px`
    el.style.marginTop = '0'
    el.style.marginBottom = '0'
    el.style.minHeight = '0'
    el.style.height = 'auto'
  })

  clone.querySelectorAll<HTMLElement>('#all-assessments > [data-pdf-block]').forEach((el) => {
    el.style.paddingLeft = `${sectionPadX}px`
    el.style.paddingRight = `${sectionPadX}px`
    el.style.paddingTop = '12px'
    el.style.paddingBottom = '14px'
    el.style.marginTop = '0'
    el.style.marginBottom = '0'
  })

  clone.querySelectorAll<HTMLElement>('.lg-kpi-strip').forEach((el) => {
    el.style.marginTop = '0'
    el.style.marginBottom = '0'
  })

  clone.querySelectorAll<HTMLElement>('.lg-footer, footer.lg-footer').forEach((el) => {
    el.style.marginTop = '10px'
    el.style.paddingTop = '18px'
    el.style.paddingBottom = '18px'
  })
}

function prepareCloneForCapture(clone: HTMLElement, sourceRoot: HTMLElement, captureWidth: number) {
  const lang = sourceRoot.dataset.activeLang ?? 'en'

  clone.classList.add('lg-report')
  clone.setAttribute('data-pdf-clone', 'true')
  clone.dataset.activeLang = lang
  clone.removeAttribute('id')

  clone.style.cssText = [
    'position:relative',
    `width:${captureWidth}px`,
    'max-width:none',
    'margin:0',
    'transform:none',
    'overflow:visible',
    'max-height:none',
    'height:auto',
    'opacity:1',
    'visibility:visible',
    'box-sizing:border-box',
    `background:${PARCHMENT_BG}`,
  ].join(';')

  clone
    .querySelectorAll<HTMLElement>(
      '.print\\:hidden, .report-toolbar, .lg-nav-pill, .lg-hero-actions, .report-lang-bar, .lg-back-link',
    )
    .forEach((el) => {
      el.style.display = 'none'
    })

  solidifyCloneForPdf(clone)

  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = window.getComputedStyle(el)
    if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
      el.style.overflow = 'visible'
      el.style.overflowY = 'visible'
      el.style.maxHeight = 'none'
    }
  })
}

function collectCaptureItems(root: HTMLElement, captureWidth: number): CaptureItem[] {
  const items: CaptureItem[] = []
  const seen = new Set<HTMLElement>()

  const pushEl = (el: HTMLElement) => {
    if (seen.has(el) || el.style.display === 'none') return
    for (const prev of seen) {
      if (prev.contains(el) && prev !== el) return
    }
    for (const prev of [...seen]) {
      if (el.contains(prev) && prev !== el) {
        seen.delete(prev)
        const idx = items.findIndex((it) => it.kind === 'element' && it.el === prev)
        if (idx >= 0) items.splice(idx, 1)
      }
    }
    seen.add(el)
    items.push({ kind: 'element', el })
  }

  /** Major report partitions only — one canvas each. */
  const TOP_SELECTOR = [
    '.lg-hero',
    '.lg-kpi-strip',
    '.lg-detail-head',
    '.lg-detail-body',
    '.lg-section',
    'section.lg-section',
    '.lg-footer',
    'footer.lg-footer',
    '[data-pdf-page]',
  ].join(', ')

  const visit = (node: HTMLElement) => {
    for (const child of Array.from(node.children) as HTMLElement[]) {
      if (child.style.display === 'none') continue

      if (child.matches(TOP_SELECTOR)) {
        // Cohort "all assessments" can be huge — keep per-test split only there.
        if (child.id === 'all-assessments') {
          const tests = Array.from(
            child.querySelectorAll(':scope > [data-pdf-block]'),
          ) as HTMLElement[]
          if (tests.length > 0) {
            items.push({ kind: 'section-header', section: child, width: captureWidth })
            for (const test of tests) pushEl(test)
          } else {
            pushEl(child)
          }
        } else {
          pushEl(child)
        }
        continue
      }

      if (
        child.id === 'profile' ||
        child.classList.contains('lg-student-page') ||
        child.classList.contains('lg-overall-page') ||
        child.querySelector(TOP_SELECTOR)
      ) {
        visit(child)
      }
    }
  }

  visit(root)

  if (items.length === 0) {
    items.push({ kind: 'element', el: root })
  }
  return items
}

function gapAfterItem(item: CaptureItem, isLast: boolean): number {
  if (isLast) return 0
  if (item.kind === 'section-header') return 1.5
  if (item.kind === 'element') {
    const el = item.el
    if (el.matches('.lg-hero')) return 0
    if (el.matches('.lg-kpi-strip, .lg-detail-head')) return BLOCK_GAP_MM
    if (el.matches('.lg-footer, footer.lg-footer')) return 0
  }
  return BLOCK_GAP_MM
}

/** Start a new PDF page before knowledge layer only (simple partition). */
function startsNewPage(item: CaptureItem): boolean {
  if (item.kind !== 'element') return false
  return item.el.matches('#knowledge-layer, .lg-kl-section')
}

async function waitForLayout() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

async function captureElement(
  el: HTMLElement,
  scale: number,
  backgroundColor: string = PARCHMENT_BG,
): Promise<HTMLCanvasElement> {
  await waitForLayout()
  return html2canvas(el, {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 15000,
    onclone: (_doc, node) => {
      node.style.opacity = '1'
      node.style.animation = 'none'
      solidifyCloneForPdf(node)
    },
  })
}

/** Clone section title/eyebrow only — used for all-assessments header. */
async function captureSectionHeader(
  section: HTMLElement,
  width: number,
  scale: number,
  staging: HTMLElement,
): Promise<HTMLCanvasElement | null> {
  const wrap = document.createElement('div')
  wrap.className = 'pdf-header-capture'
  wrap.style.cssText = [
    `width:${width}px`,
    `background:${PARCHMENT_BG}`,
    'box-sizing:border-box',
    'overflow:hidden',
    'padding:18px',
    'padding-bottom:8px',
  ].join(';')

  let hasHeader = false
  for (const sel of ['.lg-eyebrow', '.lg-section-title', '.lg-section-desc']) {
    const el = section.querySelector(sel)
    if (el) {
      wrap.appendChild(el.cloneNode(true))
      hasHeader = true
    }
  }
  if (!hasHeader) return null

  staging.appendChild(wrap)
  await waitForLayout()
  try {
    const canvas = await captureElement(wrap, scale)
    return trimCanvasWhitespace(canvas)
  } finally {
    wrap.remove()
  }
}

function isParchmentPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 12) return true
  return (
    Math.abs(r - PARCHMENT.r) <= 12 &&
    Math.abs(g - PARCHMENT.g) <= 12 &&
    Math.abs(b - PARCHMENT.b) <= 12
  )
}

/** Crop trailing/leading blank parchment rows from html2canvas output. */
function trimCanvasWhitespace(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx || canvas.height < 2) return canvas

  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data

  const rowMostlyBlank = (y: number): boolean => {
    let blank = 0
    const samples = Math.min(width, 80)
    const step = Math.max(1, Math.floor(width / samples))
    let count = 0
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      if (isParchmentPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) blank++
      count++
    }
    return blank / count >= 0.97
  }

  let top = 0
  let bottom = height - 1
  while (top < bottom && rowMostlyBlank(top)) top++
  while (bottom > top && rowMostlyBlank(bottom)) bottom--

  if (top === 0 && bottom >= height - 1) return canvas
  return sliceCanvas(canvas, top, bottom + 1)
}

function canvasHeightMm(canvas: HTMLCanvasElement): number {
  return (canvas.height * PDF_CONTENT_WIDTH_MM) / canvas.width
}

function sliceCanvas(
  canvas: HTMLCanvasElement,
  startY: number,
  endY: number,
): HTMLCanvasElement {
  const sliceHeight = Math.max(1, Math.round(endY - startY))
  const slice = document.createElement('canvas')
  slice.width = canvas.width
  slice.height = sliceHeight
  const ctx = slice.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(
    canvas,
    0,
    Math.round(startY),
    canvas.width,
    sliceHeight,
    0,
    0,
    canvas.width,
    sliceHeight,
  )
  return slice
}

interface PdfLayoutState {
  pdf: jsPDF
  pageOpen: boolean
  yMm: number
}

function drawCanvasOnPdf(state: PdfLayoutState, canvas: HTMLCanvasElement) {
  if (!canvas.width || !canvas.height) return

  const drawWidth = PDF_CONTENT_WIDTH_MM
  const pxPerMm = canvas.width / drawWidth

  let offsetPx = 0
  while (offsetPx < canvas.height) {
    const spaceMm = state.pageOpen ? PDF_CONTENT_HEIGHT_MM - state.yMm : PDF_CONTENT_HEIGHT_MM
    if (state.pageOpen && spaceMm < 1) {
      state.pdf.addPage()
      state.yMm = 0
    }

    const availableMm = state.pageOpen ? PDF_CONTENT_HEIGHT_MM - state.yMm : PDF_CONTENT_HEIGHT_MM
    const sliceHeightPx = Math.min(Math.ceil(availableMm * pxPerMm), canvas.height - offsetPx)
    const slice = sliceCanvas(canvas, offsetPx, offsetPx + sliceHeightPx)
    const sliceHeightMm = canvasHeightMm(slice)

    if (!state.pageOpen) {
      state.pageOpen = true
    } else if (state.yMm + sliceHeightMm > PDF_CONTENT_HEIGHT_MM + 0.5) {
      state.pdf.addPage()
      state.yMm = 0
    }

    state.pdf.addImage(
      slice.toDataURL('image/png'),
      'PNG',
      PDF_MARGIN_MM,
      PDF_MARGIN_MM + state.yMm,
      drawWidth,
      sliceHeightMm,
    )
    state.yMm += sliceHeightMm
    offsetPx += sliceHeightPx
  }
}

function drawBlockOnPdf(
  state: PdfLayoutState,
  canvas: HTMLCanvasElement,
  gapAfterMm: number,
  forceNewPage = false,
) {
  if (!canvas.width || !canvas.height) return

  if (forceNewPage && state.pageOpen && state.yMm > 2) {
    state.pdf.addPage()
    state.yMm = 0
  } else if (state.pageOpen && state.yMm >= PDF_CONTENT_HEIGHT_MM - 1) {
    state.pdf.addPage()
    state.yMm = 0
  }

  const blockHeightMm = canvasHeightMm(canvas)
  if (state.pageOpen && state.yMm > 0 && !forceNewPage) {
    const remaining = PDF_CONTENT_HEIGHT_MM - state.yMm
    // If the block fits on a full page but not in leftover space, move it down.
    if (blockHeightMm <= PDF_CONTENT_HEIGHT_MM - 0.5 && blockHeightMm > remaining + 0.5) {
      state.pdf.addPage()
      state.yMm = 0
    } else if (remaining < MIN_REMAINING_MM && blockHeightMm > remaining) {
      state.pdf.addPage()
      state.yMm = 0
    }
  }

  const yBefore = state.yMm
  drawCanvasOnPdf(state, canvas)

  if (state.yMm > yBefore && gapAfterMm > 0) {
    state.yMm += gapAfterMm
  }
}

export function printReport(options?: { title?: string; language?: 'en' | 'ta' }) {
  const prevTitle = document.title
  const root = document.getElementById('lg-report-print-root')
  if (options?.language && root) {
    root.dataset.activeLang = options.language
  }
  if (root) {
    root.classList.remove('atlas-page-reveal')
    root.style.animation = 'none'
    root.style.opacity = '1'
  }
  if (options?.title) {
    document.title = options.title
  }
  window.requestAnimationFrame(() => {
    window.print()
    window.setTimeout(() => {
      document.title = prevTitle
    }, 500)
  })
}

export type ReportPdfOptions = {
  title?: string
  rootId?: string
  language?: 'en' | 'ta'
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

/** Build a PDF Blob from the on-screen report (same capture path as download). */
export async function buildReportPdfBlob(
  options?: ReportPdfOptions,
): Promise<{ blob: Blob; filename: string }> {
  const root = document.getElementById(options?.rootId ?? 'lg-report-print-root')
  if (!root) {
    throw new Error('Report root not found')
  }

  if (options?.language) {
    root.dataset.activeLang = options.language
  }

  const title = options?.title ?? 'Prism_Learning_Genome_Report'
  let clone: HTMLElement | null = null
  let stagingHost: HTMLElement | null = null

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    root.querySelectorAll('.lg-overlay').forEach((el) => {
      ;(el as HTMLElement).style.display = 'none'
    })

    await waitForLayout()

    const captureWidth = Math.max(root.offsetWidth, MIN_CAPTURE_WIDTH_PX)

    stagingHost = document.createElement('div')
    stagingHost.id = 'pdf-export-staging'
    stagingHost.setAttribute('data-pdf-staging', 'true')
    stagingHost.style.cssText = [
      'position:fixed',
      'left:-15000px',
      'top:0',
      `width:${captureWidth}px`,
      'overflow:visible',
      'opacity:1',
      'visibility:visible',
      'pointer-events:none',
      'max-height:none',
      'height:auto',
    ].join(';')
    document.body.appendChild(stagingHost)

    clone = root.cloneNode(true) as HTMLElement
    prepareCloneForCapture(clone, root, captureWidth)
    stagingHost.appendChild(clone)

    await waitForLayout()
    await rasterizeLiveChartsIntoClone(root, clone)
    await waitForLayout()
    await new Promise((r) => window.setTimeout(r, 400))

    solidifyCloneForPdf(clone)
    applyPdfSpacingStyles(clone, captureWidth)

    const items = collectCaptureItems(clone, captureWidth)
    if (items.length === 0) {
      items.push({ kind: 'element', el: clone })
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const state: PdfLayoutState = { pdf, pageOpen: false, yMm: 0 }
    const scale = 2

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      let canvas: HTMLCanvasElement | null = null

      if (item.kind === 'section-header') {
        canvas = await captureSectionHeader(item.section, item.width, scale, stagingHost)
      } else {
        const domH = Math.max(item.el.scrollHeight, item.el.offsetHeight, 0)
        if (domH < 1) continue
        const inKnowledge = item.el.matches('#knowledge-layer, .lg-kl-section')
        canvas = trimCanvasWhitespace(
          await captureElement(item.el, scale, inKnowledge ? NAVY_BG : PARCHMENT_BG),
        )
      }

      if (!canvas || canvas.height < 2) continue
      drawBlockOnPdf(
        state,
        canvas,
        gapAfterItem(item, i === items.length - 1),
        startsNewPage(item),
      )
    }

    if (!state.pageOpen) {
      throw new Error('No report content captured')
    }

    const filename = `${safeFilename(title)}.pdf`
    const blob = pdf.output('blob')
    return { blob, filename }
  } finally {
    if (clone?.parentNode) clone.parentNode.removeChild(clone)
    stagingHost?.parentNode?.removeChild(stagingHost)
  }
}

export async function downloadReportPdf(options?: ReportPdfOptions): Promise<void> {
  try {
    const { blob, filename } = await buildReportPdfBlob(options)
    rememberSharePdfCache(options, blob, filename)
    triggerBlobDownload(blob, filename)
  } catch (err) {
    console.error('PDF download failed, falling back to print', err)
    printReport(options)
  }
}

/**
 * Share the report PDF via the device native share sheet (Web Share API).
 * Reuses `buildReportPdfBlob` — same PDF as Download PDF.
 * No in-app share modal. AbortError (user dismisses sheet) is silent.
 *
 * Desktop browsers often drop the transient user activation during long PDF
 * capture; we cache the last blob so a second Share click opens the sheet
 * immediately. Unsupported / blocked file share → download fallback.
 */
export type ShareReportResult =
  | 'shared'
  | 'downloaded'
  | 'cancelled'
  | 'failed'
  | 'ready-click-again'

export function messageForShareResult(result: ShareReportResult): string | null {
  switch (result) {
    case 'downloaded':
      return 'Sharing isn’t available here — PDF downloaded instead.'
    case 'ready-click-again':
      return 'PDF is ready — click Share again to open the system share sheet.'
    case 'failed':
      return 'Couldn’t share this report. Try Download PDF instead.'
    default:
      return null
  }
}

type SharePdfCache = {
  key: string
  blob: Blob
  filename: string
}

let sharePdfCache: SharePdfCache | null = null

function sharePdfCacheKey(options?: ReportPdfOptions): string {
  const rootId = options?.rootId ?? 'lg-report-print-root'
  const root = document.getElementById(rootId)
  const signature = root
    ? `${root.scrollHeight}:${root.scrollWidth}:${root.querySelectorAll('*').length}`
    : 'missing'
  return `${rootId}|${options?.title ?? ''}|${options?.language ?? ''}|${signature}`
}

function rememberSharePdfCache(
  options: ReportPdfOptions | undefined,
  blob: Blob,
  filename: string,
) {
  sharePdfCache = {
    key: sharePdfCacheKey(options),
    blob,
    filename,
  }
}

function getCachedSharePdf(
  options?: ReportPdfOptions,
): { blob: Blob; filename: string } | null {
  if (!sharePdfCache) return null
  if (sharePdfCache.key !== sharePdfCacheKey(options)) return null
  return { blob: sharePdfCache.blob, filename: sharePdfCache.filename }
}

async function resolveSharePdf(
  options?: ReportPdfOptions,
): Promise<{ blob: Blob; filename: string; fromCache: boolean }> {
  const cached = getCachedSharePdf(options)
  if (cached) {
    return { ...cached, fromCache: true }
  }
  const built = await buildReportPdfBlob(options)
  rememberSharePdfCache(options, built.blob, built.filename)
  return { ...built, fromCache: false }
}

function canSharePdfFile(file: File): boolean {
  if (typeof navigator.share !== 'function') return false
  if (typeof navigator.canShare !== 'function') {
    // Older Safari: try share anyway.
    return true
  }
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

async function tryNativePdfShare(file: File): Promise<'shared' | 'cancelled' | 'blocked'> {
  // Prefer files-only — Windows/Chromium share sheet is most reliable this way.
  const payloads: ShareData[] = [
    { files: [file] },
    { title: 'Student Report', text: 'Student Report', files: [file] },
  ]

  let sawNonAbortFailure = false

  for (const data of payloads) {
    if (typeof navigator.canShare === 'function') {
      try {
        if (!navigator.canShare(data)) continue
      } catch {
        continue
      }
    }
    try {
      await navigator.share(data)
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
      sawNonAbortFailure = true
      // Try next payload (e.g. files-only vs files+meta).
    }
  }

  return sawNonAbortFailure || payloads.length > 0 ? 'blocked' : 'blocked'
}

export async function shareReportPdf(
  options?: ReportPdfOptions,
): Promise<ShareReportResult> {
  try {
    const { blob, filename, fromCache } = await resolveSharePdf(options)
    const pdfFile = new File([blob], 'student-report.pdf', {
      type: 'application/pdf',
      lastModified: Date.now(),
    })

    if (!canSharePdfFile(pdfFile)) {
      triggerBlobDownload(blob, filename)
      return 'downloaded'
    }

    const outcome = await tryNativePdfShare(pdfFile)
    if (outcome === 'shared') return 'shared'
    if (outcome === 'cancelled') return 'cancelled'

    // Gesture often expires after a long html2canvas capture. Cache is warm —
    // ask the user to click Share once more (instant share under a fresh gesture).
    if (!fromCache) {
      return 'ready-click-again'
    }

    triggerBlobDownload(blob, filename)
    return 'downloaded'
  } catch (err) {
    console.error('PDF share failed', err)
    return 'failed'
  }
}

export function scrollToReportSection(href: string) {
  const id = href.startsWith('#') ? href.slice(1) : href
  if (!id) return
  const el = document.getElementById(id)
  if (!el) return
  const scroller = el.closest('main')
  if (scroller instanceof HTMLElement) {
    const scrollerTop = scroller.getBoundingClientRect().top
    const elTop = el.getBoundingClientRect().top
    scroller.scrollTo({
      top: scroller.scrollTop + elTop - scrollerTop - 8,
      behavior: 'smooth',
    })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  try {
    window.history.replaceState(null, '', `#${id}`)
  } catch {
    /* ignore */
  }
}
