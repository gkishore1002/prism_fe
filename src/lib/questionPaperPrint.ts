import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PDF_MARGIN_MM = 12
const PDF_PAGE_WIDTH_MM = 210
const PDF_PAGE_HEIGHT_MM = 297
const PDF_CONTENT_WIDTH_MM = PDF_PAGE_WIDTH_MM - PDF_MARGIN_MM * 2
const PDF_CONTENT_HEIGHT_MM = PDF_PAGE_HEIGHT_MM - PDF_MARGIN_MM * 2

export const QUESTION_PAPER_PRINT_ROOT_ID = 'question-paper-print-root'

function safeFilename(title: string): string {
  const cleaned = title
    .replace(/[^\w\s\-—.]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
  return (cleaned || 'Question_Paper').slice(0, 80)
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
  })
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        }),
    ),
  )
}

export function printQuestionPaper(options?: { title?: string; rootId?: string }) {
  const prevTitle = document.title
  const root = document.getElementById(options?.rootId ?? QUESTION_PAPER_PRINT_ROOT_ID)
  if (!root) return

  if (options?.title) document.title = options.title
  document.body.classList.add('printing-question-paper')

  window.requestAnimationFrame(() => {
    window.print()
    window.setTimeout(() => {
      document.title = prevTitle
      document.body.classList.remove('printing-question-paper')
    }, 500)
  })
}

export async function downloadQuestionPaperPdf(options?: {
  title?: string
  rootId?: string
}): Promise<void> {
  const root = document.getElementById(options?.rootId ?? QUESTION_PAPER_PRINT_ROOT_ID)
  if (!root) {
    printQuestionPaper(options)
    return
  }

  const title = options?.title ?? 'Question_Paper'

  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  await waitForImages(root)
  await waitForLayout()

  const canvas = await html2canvas(root, {
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const imgWidthMm = PDF_CONTENT_WIDTH_MM
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width
  const pageCanvasHeight = Math.floor((PDF_CONTENT_HEIGHT_MM / imgHeightMm) * canvas.height)

  let renderedHeight = 0
  let pageIndex = 0

  while (renderedHeight < canvas.height) {
    const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) break
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(
      canvas,
      0,
      renderedHeight,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight,
    )

    const sliceHeightMm = (sliceHeight * imgWidthMm) / canvas.width
    const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.92)
    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(dataUrl, 'JPEG', PDF_MARGIN_MM, PDF_MARGIN_MM, imgWidthMm, sliceHeightMm)

    renderedHeight += sliceHeight
    pageIndex += 1
  }

  pdf.save(`${safeFilename(title)}.pdf`)
}
