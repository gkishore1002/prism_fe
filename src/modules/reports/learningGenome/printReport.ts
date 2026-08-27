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

const BLOCK_SELECTOR =
  '.lg-hero, .lg-kpi-strip, .lg-section, section.lg-section, .lg-footer, footer.lg-footer'

const PARCHMENT_BG = '#f6f1e4'

/** Small gap between consecutive blocks on the same PDF page (mm). */
const BLOCK_GAP_MM = 2
/** Start a new page when less than this remains (mm). */
const MIN_REMAINING_MM = 12

type CaptureItem =
  | { kind: 'element'; el: HTMLElement }
  | { kind: 'section-header'; section: HTMLElement; width: number }

function safeFilename(title: string): string {
  const cleaned = title
    .replace(/[^\w\s\-—.]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
  return (cleaned || 'Prism_Report').slice(0, 80)
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

  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    el.style.animation = 'none'
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = 'none'
    el.style.filter = 'none'
    el.style.backdropFilter = 'none'
    el.style.setProperty('-webkit-backdrop-filter', 'none')

    const inHero = el.closest('.lg-hero, .lg-detail-head, .lg-footer, .lg-kl-section, .lg-insight-feed') !== null
    const bgBase = inHero ? NAVY : PARCHMENT
    solidifyBackground(el, bgBase)
  })
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
    seen.add(el)
    items.push({ kind: 'element', el })
  }

  const visit = (node: HTMLElement) => {
    for (const child of Array.from(node.children) as HTMLElement[]) {
      if (child.style.display === 'none') continue

      if (child.matches('.lg-hero, .lg-kpi-strip, .lg-footer, footer.lg-footer')) {
        pushEl(child)
        continue
      }

      if (child.matches('.lg-section, section.lg-section')) {
        if (child.id === 'all-assessments') {
          const testBlocks = Array.from(
            child.querySelectorAll(':scope > [data-pdf-block]'),
          ) as HTMLElement[]
          if (testBlocks.length > 0) {
            items.push({ kind: 'section-header', section: child, width: captureWidth })
            for (const test of testBlocks) pushEl(test)
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
        child.classList.contains('lg-detail-body') ||
        child.querySelector(BLOCK_SELECTOR)
      ) {
        visit(child)
      }
    }
  }

  visit(root)
  return items
}

function gapAfterItem(item: CaptureItem, isLast: boolean): number {
  if (isLast) return 0
  if (item.kind === 'section-header') return 1.5
  if (item.kind === 'element') {
    const el = item.el
    if (el.matches('.lg-hero')) return 0
    if (el.matches('.lg-kpi-strip')) return BLOCK_GAP_MM
    if (el.matches('[data-pdf-block]') && el.closest('#all-assessments')) return BLOCK_GAP_MM
    if (el.matches('.lg-footer, footer.lg-footer')) return 0
  }
  return BLOCK_GAP_MM
}

async function waitForLayout() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

async function captureElement(el: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  await waitForLayout()
  return html2canvas(el, {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: PARCHMENT_BG,
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

/** Clone section title/eyebrow only — avoids empty space from hidden siblings. */
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
) {
  if (!canvas.width || !canvas.height) return

  if (state.pageOpen && state.yMm >= PDF_CONTENT_HEIGHT_MM - 1) {
    state.pdf.addPage()
    state.yMm = 0
  }

  const blockHeightMm = canvasHeightMm(canvas)
  if (state.pageOpen && state.yMm > 0) {
    const remaining = PDF_CONTENT_HEIGHT_MM - state.yMm
    if (remaining < MIN_REMAINING_MM && blockHeightMm > remaining) {
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

export async function downloadReportPdf(options?: {
  title?: string
  rootId?: string
  language?: 'en' | 'ta'
}): Promise<void> {
  const root = document.getElementById(options?.rootId ?? 'lg-report-print-root')
  if (!root) {
    printReport(options)
    return
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
    await new Promise((r) => window.setTimeout(r, 600))

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
        canvas = trimCanvasWhitespace(await captureElement(item.el, scale))
      }

      if (!canvas || canvas.height < 2) continue
      drawBlockOnPdf(state, canvas, gapAfterItem(item, i === items.length - 1))
    }

    if (!state.pageOpen) {
      throw new Error('No report content captured')
    }

    pdf.save(`${safeFilename(title)}.pdf`)
  } catch (err) {
    console.error('PDF download failed, falling back to print', err)
    printReport(options)
  } finally {
    if (clone?.parentNode) clone.parentNode.removeChild(clone)
    stagingHost?.parentNode?.removeChild(stagingHost)
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
